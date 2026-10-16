<?php

/**
 * @file
 * Сводка по заявкам для проверки атрибуции. Запуск:
 * ddev drush php:script scripts/dev/lead-stats.php
 */

$db = \Drupal::database();
if (!$db->schema()->tableExists('kvarta_lead')) {
  echo 'Таблицы kvarta_lead нет — модуль не установлен.' . PHP_EOL;
  return;
}

$total = (int) $db->select('kvarta_lead', 'l')->countQuery()->execute()->fetchField();
echo 'Всего заявок: ' . $total . PHP_EOL;

$rows = $db->select('kvarta_lead', 'l')
  ->fields('l', [
    'id', 'name', 'phone_display', 'interest', 'utm_source', 'utm_medium',
    'utm_campaign', 'utm_content', 'click_id', 'click_id_type', 'landing_page',
    'referrer', 'telegram_status',
  ])
  ->orderBy('id', 'DESC')
  ->range(0, 5)
  ->execute()
  ->fetchAll(\PDO::FETCH_ASSOC);

foreach ($rows as $row) {
  echo sprintf(
    "#%s %s | %s | %s | источник: %s/%s | кампания: %s | объявление: %s | click: %s (%s) | вход: %s | referrer: %s | tg: %s\n",
    $row['id'],
    $row['name'],
    $row['phone_display'],
    $row['interest'],
    $row['utm_source'] !== '' ? $row['utm_source'] : '—',
    $row['utm_medium'] !== '' ? $row['utm_medium'] : '—',
    $row['utm_campaign'] !== '' ? $row['utm_campaign'] : '—',
    $row['utm_content'] !== '' ? $row['utm_content'] : '—',
    $row['click_id'] !== '' ? $row['click_id'] : '—',
    $row['click_id_type'] !== '' ? $row['click_id_type'] : '—',
    $row['landing_page'] !== '' ? $row['landing_page'] : '—',
    $row['referrer'] !== '' ? $row['referrer'] : '—',
    $row['telegram_status'] !== '' ? $row['telegram_status'] : '—',
  );
}

// Проверяем, что телефон не хранится в открытом виде дважды и что хеш есть.
$duplicates = $db->query(
  'SELECT phone_hash, COUNT(*) AS c FROM {kvarta_lead} GROUP BY phone_hash, slot HAVING c > 1'
)->fetchAll();
echo 'Нарушений уникальности phone_hash + slot: ' . count($duplicates) . PHP_EOL;

$sources = \Drupal::database()->query(
  'SELECT COALESCE(NULLIF(utm_source, \'\'), \'прямые заходы\') AS source, COUNT(*) AS c FROM {kvarta_lead} GROUP BY source ORDER BY c DESC'
)->fetchAll(\PDO::FETCH_ASSOC);
foreach ($sources as $source) {
  echo '  ' . $source['source'] . ': ' . $source['c'] . PHP_EOL;
}
