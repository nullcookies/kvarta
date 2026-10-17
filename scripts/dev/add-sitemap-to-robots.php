<?php

/**
 * @file
 * Добавляет строку Sitemap в robots.txt из конфига robotstxt.settings.
 *
 * Запуск: ddev drush php:script scripts/dev/add-sitemap-to-robots.php
 */

declare(strict_types=1);

$site_url = \Drupal::config('system.site')->get('url');
$site_url = rtrim((string) $site_url, '/');
$sitemap_line = 'Sitemap: ' . $site_url . '/sitemap.xml';

$config = \Drupal::configFactory()->getEditable('robotstxt.settings');
$content = (string) $config->get('content');

// Убираем прежние строки Sitemap, чтобы не было дублей.
$lines = preg_split('/\r\n|\r|\n/', $content);
$lines = array_values(array_filter($lines, static function (string $line): bool {
  return stripos($line, 'sitemap:') !== 0;
}));
// Приводим хвост к одному переводу строки.
while (!empty($lines) && trim((string) end($lines)) === '') {
  array_pop($lines);
}
$lines[] = '';
$lines[] = $sitemap_line;

$config->set('content', implode("\n", $lines))->save();

echo "robots.txt:\n" . $sitemap_line . "\n";
