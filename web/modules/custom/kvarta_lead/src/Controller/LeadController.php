<?php

declare(strict_types=1);

namespace Drupal\kvarta_lead\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Flood\FloodInterface;
use Drupal\Core\Site\Settings;
use Drupal\kvarta_lead\LeadManager;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Публичный эндпоинт приёма заявок: POST /api/lead.
 */
final class LeadController extends ControllerBase {

  /**
   * Сколько заявок с одного IP пропускаем в час.
   */
  private const FLOOD_THRESHOLD = 10;

  /**
   * Окно flood control в секундах.
   */
  private const FLOOD_WINDOW = 3600;

  public function __construct(
    private readonly LeadManager $manager,
    private readonly FloodInterface $flood,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('kvarta_lead.manager'),
      $container->get('flood'),
    );
  }

  /**
   * Принимает заявку с лендинга.
   */
  public function submit(Request $request): JsonResponse {
    $data = $this->payload($request);

    // Honeypot: скрытое поле заполняют только боты. Отвечаем «успехом»,
    // чтобы не подсказывать им, что их раскусили, но заявку не пишем.
    if (trim((string) ($data['website'] ?? '')) !== '') {
      $this->getLogger('kvarta_lead')->notice('Заявка отброшена honeypot-полем, IP: @ip', [
        '@ip' => (string) $request->getClientIp(),
      ]);
      return new JsonResponse([
        'ok' => TRUE,
        'duplicate' => FALSE,
        'message' => 'Спасибо! Заявка принята.',
      ]);
    }

    $identifier = (string) $request->getClientIp();
    if (!$this->flood->isAllowed('kvarta_lead.submit', self::FLOOD_THRESHOLD, self::FLOOD_WINDOW, $identifier)) {
      return new JsonResponse([
        'ok' => FALSE,
        'duplicate' => FALSE,
        'errors' => [],
        'message' => 'Слишком много заявок с вашего адреса. Позвоните нам: +375 (29) 123-45-67.',
      ], 429);
    }

    $result = $this->manager->submit($data, $this->context($request, $data));

    if ($result['ok'] && !$result['duplicate']) {
      $this->flood->register('kvarta_lead.submit', self::FLOOD_WINDOW, $identifier);
    }

    return new JsonResponse([
      'ok' => $result['ok'],
      'duplicate' => $result['duplicate'],
      'lead_id' => $result['lead_id'],
      'errors' => (object) $result['errors'],
      'message' => $result['message'],
    ], $result['status']);
  }

  /**
   * Разбирает тело запроса: JSON или обычная форма.
   *
   * @return array<string, mixed>
   */
  private function payload(Request $request): array {
    $content = (string) $request->getContent();
    if ($content !== '' && str_contains((string) $request->headers->get('Content-Type'), 'json')) {
      $decoded = json_decode($content, TRUE);
      if (is_array($decoded)) {
        return $decoded;
      }
    }
    return $request->request->all();
  }

  /**
   * Атрибуция: реклама, объявление, страницы входа и отправки.
   *
   * @return array<string, mixed>
   */
  private function context(Request $request, array $data): array {
    $fields = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'click_id', 'click_id_type', 'referrer', 'landing_page', 'page_url',
    ];

    $context = [];
    foreach ($fields as $field) {
      $value = $data[$field] ?? $request->headers->get('Referer', '');
      $context[$field] = is_scalar($value) ? (string) $value : '';
    }

    // Referer из заголовка — запасной вариант, если фронт не прислал поле.
    if ($context['referrer'] === '') {
      $context['referrer'] = (string) $request->headers->get('Referer', '');
    }

    $context['user_agent'] = mb_substr((string) $request->headers->get('User-Agent', ''), 0, 512);
    $context['ip_hash'] = hash('sha256', Settings::getHashSalt() . '|' . (string) $request->getClientIp());

    return $context;
  }

}
