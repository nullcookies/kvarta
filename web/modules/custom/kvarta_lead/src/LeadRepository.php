<?php

declare(strict_types=1);

namespace Drupal\kvarta_lead;

use Drupal\Core\Database\Connection;

/**
 * Хранилище заявок: таблица kvarta_lead в основной БД сайта.
 */
final class LeadRepository {

  /**
   * Имя таблицы заявок.
   */
  public const TABLE = 'kvarta_lead';

  /**
   * Окно дедупликации в секундах (10 минут по ТЗ).
   */
  public const DEDUPE_WINDOW = 600;

  public function __construct(
    private readonly Connection $database,
  ) {}

  /**
   * Ищет заявку с тем же номером внутри окна дедупликации.
   *
   * @return array<string, mixed>|null
   *   Строка заявки или NULL.
   */
  public function findRecentDuplicate(string $phone_hash, int $now): ?array {
    $query = $this->database->select(self::TABLE, 'l');
    $query->fields('l', ['id', 'created', 'name', 'phone_display', 'interest']);
    $query->condition('phone_hash', $phone_hash);
    $query->condition('created', $now - self::DEDUPE_WINDOW, '>=');
    $query->orderBy('created', 'DESC');
    $query->range(0, 1);
    $row = $query->execute()->fetch(\PDO::FETCH_ASSOC);
    return $row === FALSE ? NULL : $row;
  }

  /**
   * Записывает заявку.
   *
   * @throws \Drupal\Core\Database\IntegrityConstraintViolationException
   *   Если сработал уникальный индекс (phone_hash + slot).
   */
  public function insert(array $record): int {
    return (int) $this->database
      ->insert(self::TABLE)
      ->fields($record)
      ->execute();
  }

  /**
   * Записывает результат отправки в Telegram.
   */
  public function setTelegramStatus(int $id, string $status): void {
    $this->database->update(self::TABLE)
      ->fields(['telegram_status' => $status])
      ->condition('id', $id)
      ->execute();
  }

  /**
   * Последние заявки для админского списка.
   *
   * @return array<int, array<string, mixed>>
   */
  public function loadPage(int $limit = 50): array {
    $query = $this->database->select(self::TABLE, 'l');
    $query->fields('l');
    $query->orderBy('created', 'DESC');
    $query->range(0, $limit);
    return $query->execute()->fetchAll(\PDO::FETCH_ASSOC);
  }

  /**
   * Сколько заявок пришло с каждого источника — для быстрой сводки.
   *
   * @return array<int, array<string, mixed>>
   */
  public function sourceSummary(): array {
    $query = $this->database->select(self::TABLE, 'l');
    $query->addField('l', 'utm_source');
    $query->addExpression('COUNT(*)', 'total');
    $query->groupBy('l.utm_source');
    $query->orderBy('total', 'DESC');
    return $query->execute()->fetchAll(\PDO::FETCH_ASSOC);
  }

  /**
   * Удаляет заявку (для чистки тестовых данных).
   */
  public function delete(int $id): void {
    $this->database->delete(self::TABLE)->condition('id', $id)->execute();
  }

}
