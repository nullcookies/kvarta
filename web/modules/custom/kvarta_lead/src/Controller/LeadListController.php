<?php

declare(strict_types=1);

namespace Drupal\kvarta_lead\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\kvarta_lead\LeadRepository;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Простой список заявок для менеджера: /admin/content/kvarta-leads.
 */
final class LeadListController extends ControllerBase {

  public function __construct(
    private readonly Connection $database,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static($container->get('database'));
  }

  /**
   * Строит таблицу заявок.
   */
  public function list(): array {
    $repository = new LeadRepository($this->database);
    $leads = $repository->loadPage(100);

    $interests = [
      'subscription' => 'Подписка',
      'order' => 'Разовый заказ',
      'question' => 'Вопрос',
    ];

    $rows = [];
    foreach ($leads as $lead) {
      $source = trim(implode(' / ', array_filter([
        (string) $lead['utm_source'],
        (string) $lead['utm_medium'],
      ])), ' /');
      $rows[] = [
        'id' => $lead['id'],
        'created' => \Drupal::service('date.formatter')->format((int) $lead['created'], 'custom', 'd.m.Y H:i'),
        'name' => $lead['name'],
        'phone' => $lead['phone_display'],
        'interest' => $interests[$lead['interest']] ?? $lead['interest'],
        'comment' => $lead['comment'],
        'source' => $source !== '' ? $source : 'прямой заход',
        'campaign' => $lead['utm_campaign'],
        'page' => $lead['landing_page'],
      ];
    }

    return [
      'summary' => [
        '#type' => 'markup',
        '#markup' => $this->t('Всего показано заявок: @count. Источники: @sources', [
          '@count' => count($rows),
          '@sources' => $this->sources($repository),
        ]),
        '#prefix' => '<p>',
        '#suffix' => '</p>',
      ],
      'table' => [
        '#type' => 'table',
        '#header' => [
          $this->t('№'),
          $this->t('Когда'),
          $this->t('Имя'),
          $this->t('Телефон'),
          $this->t('Интерес'),
          $this->t('Комментарий'),
          $this->t('Источник'),
          $this->t('Кампания'),
          $this->t('Страница входа'),
        ],
        '#rows' => $rows,
        '#empty' => $this->t('Заявок пока нет.'),
      ],
    ];
  }

  /**
   * Сводка по источникам.
   */
  private function sources(LeadRepository $repository): string {
    $parts = [];
    foreach ($repository->sourceSummary() as $row) {
      $source = $row['utm_source'] !== '' ? $row['utm_source'] : 'прямые заходы';
      $parts[] = sprintf('%s — %s', $source, $row['total']);
    }
    return $parts === [] ? 'нет данных' : implode(', ', $parts);
  }

}
