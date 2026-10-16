<?php

declare(strict_types=1);

namespace Drupal\kvarta_lead;

use Drupal\Core\Database\IntegrityConstraintViolationException;
use Drupal\Core\Lock\LockBackendInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\kvarta_lead\Notifier\TelegramNotifier;
use Drupal\kvarta_lead\Phone\ByPhoneNumber;

/**
 * Приём заявки: проверка полей, дедупликация, сохранение, уведомление.
 */
final class LeadManager {

  /**
   * Что интересует клиента.
   */
  public const INTERESTS = ['subscription', 'order', 'question'];

  /**
   * Поля атрибуции, которые принимаем от фронтенда.
   */
  private const CONTEXT_FIELDS = [
    'utm_source' => 128,
    'utm_medium' => 128,
    'utm_campaign' => 128,
    'utm_content' => 128,
    'utm_term' => 128,
    'click_id_type' => 16,
    'click_id' => 255,
    'referrer' => 512,
    'landing_page' => 512,
    'page_url' => 512,
  ];

  public function __construct(
    private readonly LeadRepository $repository,
    private readonly ByPhoneNumber $phone,
    private readonly TelegramNotifier $telegram,
    private readonly LockBackendInterface $lock,
    private readonly LoggerChannelFactoryInterface $logger_factory,
  ) {}

  /**
   * Обрабатывает заявку.
   *
   * @param array<string, mixed> $input
   *   Данные формы.
   * @param array<string, mixed> $context
   *   Атрибуция и технические данные (utm, referrer, ip_hash, user_agent).
   *
   * @return array<string, mixed>
   *   ok | status | duplicate | lead_id | errors | message
   */
  public function submit(array $input, array $context): array {
    $values = $this->validate($input);
    if ($values['errors'] !== []) {
      return [
        'ok' => FALSE,
        'status' => 422,
        'duplicate' => FALSE,
        'lead_id' => NULL,
        'errors' => $values['errors'],
        'message' => 'Проверьте, пожалуйста, отмеченные поля.',
      ];
    }

    $now = time();
    $phone_hash = hash('sha256', $values['phone_e164']);
    $lock_id = 'kvarta_lead:' . $phone_hash;

    // Двойное нажатие и параллельные запросы выстраиваются в очередь:
    // второй запрос ждёт до 5 секунд, пока первый запишет заявку.
    if (!$this->lock->acquire($lock_id, 5.0)) {
      return [
        'ok' => TRUE,
        'status' => 200,
        'duplicate' => TRUE,
        'lead_id' => NULL,
        'errors' => [],
        'message' => 'Заявка с этим номером уже отправляется — менеджер перезвонит.',
      ];
    }

    try {
      $existing = $this->repository->findRecentDuplicate($phone_hash, $now);
      if ($existing !== NULL) {
        return [
          'ok' => TRUE,
          'status' => 200,
          'duplicate' => TRUE,
          'lead_id' => (int) $existing['id'],
          'errors' => [],
          'message' => 'Заявку с этим номером мы уже приняли — менеджер перезвонит в рабочее время.',
        ];
      }

      $record = $this->buildRecord($values, $context, $phone_hash, $now);
      try {
        $id = $this->repository->insert($record);
      }
      catch (IntegrityConstraintViolationException) {
        // Гонка на границе окна: уникальный индекс phone_hash + slot.
        $existing = $this->repository->findRecentDuplicate($phone_hash, $now);
        return [
          'ok' => TRUE,
          'status' => 200,
          'duplicate' => TRUE,
          'lead_id' => $existing === NULL ? NULL : (int) $existing['id'],
          'errors' => [],
          'message' => 'Заявку с этим номером мы уже приняли — менеджер перезвонит в рабочее время.',
        ];
      }

      $record['id'] = $id;
      $this->logger_factory->get('kvarta_lead')->info(
        'Новая заявка №@id (@phone) с источника @source/@medium.',
        [
          '@id' => (string) $id,
          '@phone' => $values['phone_display'],
          '@source' => $record['utm_source'] !== '' ? $record['utm_source'] : '—',
          '@medium' => $record['utm_medium'] !== '' ? $record['utm_medium'] : '—',
        ],
      );

      $status = $this->telegram->send($record);
      if ($status !== 'skipped') {
        $this->repository->setTelegramStatus($id, $status);
      }

      return [
        'ok' => TRUE,
        'status' => 201,
        'duplicate' => FALSE,
        'lead_id' => $id,
        'errors' => [],
        'message' => 'Спасибо! Заявка принята — перезвоним в рабочее время и подтвердим детали.',
      ];
    }
    finally {
      $this->lock->release($lock_id);
    }
  }

  /**
   * Проверяет и очищает поля формы.
   *
   * @return array<string, mixed>
   *   values + errors
   */
  private function validate(array $input): array {
    $errors = [];

    $name = $this->clean((string) ($input['name'] ?? ''), 128);
    if ($name === '') {
      $errors['name'] = 'Как к вам обращаться? Укажите имя.';
    }
    elseif (mb_strlen($name) < 2) {
      $errors['name'] = 'Имя слишком короткое — напишите, пожалуйста, полностью.';
    }

    $phone = $this->phone->validate((string) ($input['phone'] ?? ''));
    if (!$phone['valid']) {
      $errors['phone'] = ByPhoneNumber::hint($phone['error_key']);
    }

    $interest = (string) ($input['interest'] ?? '');
    if (!in_array($interest, self::INTERESTS, TRUE)) {
      $errors['interest'] = 'Выберите, что вас интересует: подписка, разовый заказ или вопрос.';
    }

    $comment = $this->clean((string) ($input['comment'] ?? ''), 2000);
    if (mb_strlen($comment) > 2000) {
      $errors['comment'] = 'Комментарий слишком длинный — до 2000 символов.';
    }

    return [
      'name' => $name,
      'phone_e164' => $phone['e164'],
      'phone_display' => $phone['pretty'],
      'interest' => $interest,
      'comment' => $comment,
      'errors' => $errors,
    ];
  }

  /**
   * Готовит строку для вставки в БД.
   *
   * @return array<string, mixed>
   */
  private function buildRecord(array $values, array $context, string $phone_hash, int $now): array {
    $now = $now ?: time();
    $record = [
      'created' => $now,
      'slot' => intdiv($now, LeadRepository::DEDUPE_WINDOW),
      'name' => $values['name'],
      'phone' => $values['phone_e164'],
      'phone_display' => $values['phone_display'],
      'phone_hash' => $phone_hash,
      'interest' => $values['interest'],
      'comment' => $values['comment'],
      'user_agent' => $this->clean((string) ($context['user_agent'] ?? ''), 512),
      'ip_hash' => (string) ($context['ip_hash'] ?? ''),
      'telegram_status' => '',
    ];

    foreach (self::CONTEXT_FIELDS as $field => $length) {
      $record[$field] = $this->clean((string) ($context[$field] ?? ''), $length);
    }

    return $record;
  }

  /**
   * Убирает теги, управляющие символы и лишние пробелы, режет по длине.
   */
  private function clean(string $value, int $max_length): string {
    $value = strip_tags($value);
    $value = (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', ' ', $value);
    $value = trim((string) preg_replace('/\s+/u', ' ', $value));
    return mb_substr($value, 0, $max_length);
  }

}
