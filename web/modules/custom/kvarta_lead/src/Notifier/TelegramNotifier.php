<?php

declare(strict_types=1);

namespace Drupal\kvarta_lead\Notifier;

use Drupal\Component\Utility\Html;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;

/**
 * Дублирование заявки в Telegram (необязательный плюс из ТЗ).
 *
 * Включается переменными окружения KVARTA_TELEGRAM_TOKEN и
 * KVARTA_TELEGRAM_CHAT_ID (DDEV: ddev dotenv set .ddev/.env). Если переменных
 * нет — молча пропускаем, заявка всё равно сохраняется.
 */
final class TelegramNotifier {

  /**
   * Таймаут запроса в секундах: заявку нельзя задерживать из-за Telegram.
   */
  private const TIMEOUT = 4.0;

  public function __construct(
    private readonly ClientInterface $http_client,
    private readonly LoggerChannelFactoryInterface $logger_factory,
  ) {}

  /**
   * Настроен ли бот.
   */
  public function isConfigured(): bool {
    return $this->token() !== '' && $this->chatId() !== '';
  }

  /**
   * Отправляет заявку в Telegram.
   *
   * @return string
   *   sent | skipped | failed
   */
  public function send(array $lead): string {
    if (!$this->isConfigured()) {
      return 'skipped';
    }

    $url = sprintf('https://api.telegram.org/bot%s/sendMessage', $this->token());

    try {
      $this->http_client->post($url, [
        'timeout' => self::TIMEOUT,
        'json' => [
          'chat_id' => $this->chatId(),
          'parse_mode' => 'HTML',
          'disable_web_page_preview' => TRUE,
          'text' => $this->message($lead),
        ],
      ]);
      return 'sent';
    }
    catch (GuzzleException $e) {
      $this->logger_factory->get('kvarta_lead')
        ->error('Не удалось отправить заявку @id в Telegram: @message', [
          '@id' => (string) ($lead['id'] ?? '?'),
          '@message' => $e->getMessage(),
        ]);
      return 'failed';
    }
  }

  /**
   * Текст сообщения менеджеру.
   */
  private function message(array $lead): string {
    $e = static fn (string $value): string => Html::escape($value);

    $interest = [
      'subscription' => 'Подписка',
      'order' => 'Разовый заказ',
      'question' => 'Вопрос',
    ][$lead['interest'] ?? ''] ?? (string) ($lead['interest'] ?? '');

    $lines = [
      '☕ <b>Новая заявка с лендинга</b>',
      sprintf('<b>Имя:</b> %s', $e((string) ($lead['name'] ?? ''))),
      sprintf('<b>Телефон:</b> %s', $e((string) ($lead['phone_display'] ?? ''))),
      sprintf('<b>Интересует:</b> %s', $e($interest)),
    ];

    if (!empty($lead['comment'])) {
      $lines[] = sprintf('<b>Комментарий:</b> %s', $e((string) $lead['comment']));
    }

    $lines[] = '';
    $lines[] = sprintf('<b>Источник:</b> %s / %s', $e((string) ($lead['utm_source'] ?? '—')), $e((string) ($lead['utm_medium'] ?? '—')));
    $lines[] = sprintf('<b>Кампания:</b> %s', $e((string) ($lead['utm_campaign'] ?? '—')));
    if (!empty($lead['utm_content'])) {
      $lines[] = sprintf('<b>Объявление:</b> %s', $e((string) $lead['utm_content']));
    }
    if (!empty($lead['click_id'])) {
      $lines[] = sprintf('<b>Click ID:</b> %s (%s)', $e((string) $lead['click_id']), $e((string) $lead['click_id_type']));
    }
    $lines[] = sprintf('<b>Страница входа:</b> %s', $e((string) ($lead['landing_page'] ?? '—')));
    $lines[] = sprintf('<b>Страница отправки:</b> %s', $e((string) ($lead['page_url'] ?? '—')));
    $lines[] = sprintf('<b>Referrer:</b> %s', $e((string) ($lead['referrer'] ?? '—')));
    $lines[] = sprintf('<b>Заявка №:</b> %s', $e((string) ($lead['id'] ?? '')));

    return implode("\n", $lines);
  }

  private function token(): string {
    return trim((string) (getenv('KVARTA_TELEGRAM_TOKEN') ?: ''));
  }

  private function chatId(): string {
    return trim((string) (getenv('KVARTA_TELEGRAM_CHAT_ID') ?: ''));
  }

}
