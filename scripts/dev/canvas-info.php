<?php

/**
 * @file
 * Диагностика Canvas: страницы, регионы, тема. Запуск:
 * ddev drush php:script scripts/dev/canvas-info.php
 */

$etm = \Drupal::entityTypeManager();

echo 'Тема по умолчанию: ' . \Drupal::config('system.theme')->get('default') . PHP_EOL;
echo 'Тема админки: ' . \Drupal::config('system.theme')->get('admin') . PHP_EOL;

if ($etm->hasDefinition('canvas_page')) {
  $pages = $etm->getStorage('canvas_page')->loadMultiple();
  echo 'canvas_page: ' . count($pages) . PHP_EOL;
  foreach ($pages as $page) {
    echo '  - ' . $page->id() . ' | ' . $page->label() . ' | ' . $page->toUrl()->toString() . PHP_EOL;
  }
}

if ($etm->hasDefinition('content_template')) {
  $templates = $etm->getStorage('content_template')->loadMultiple();
  echo 'content_template: ' . count($templates) . PHP_EOL;
  foreach ($templates as $template) {
    echo '  - ' . $template->id() . ' | status=' . (int) $template->status() . PHP_EOL;
  }
}

$region_config = \Drupal::configFactory()->listAll('canvas.page_region');
echo 'canvas.page_region: ' . (count($region_config) ? implode(', ', $region_config) : 'нет') . PHP_EOL;

echo 'Темы: ' . implode(', ', array_keys(\Drupal::config('core.extension')->get('theme'))) . PHP_EOL;

$theme = \Drupal::theme()->getActiveTheme();
echo 'Активная тема: ' . $theme->getName() . PHP_EOL;
echo 'Регионы активной темы: ' . implode(', ', array_keys($theme->getRegions())) . PHP_EOL;

echo 'Типы материалов: ' . implode(', ', array_keys($etm->getStorage('node_type')->loadMultiple())) . PHP_EOL;
echo 'Заявки в kvarta_lead: ';
if (\Drupal::database()->schema()->tableExists('kvarta_lead')) {
  echo \Drupal::database()->select('kvarta_lead', 'l')->countQuery()->execute()->fetchField() . PHP_EOL;
}
else {
  echo 'таблицы нет' . PHP_EOL;
}
