<?php

/**
 * @file
 * Показывает, как в компонентах страницы хранятся картинки (для preload).
 * Запуск: ddev drush php:script scripts/dev/dump-page-images.php
 */

$storage = \Drupal::entityTypeManager()->getStorage('canvas_page');
foreach ($storage->loadMultiple() as $page) {
  echo '#' . $page->id() . ' ' . $page->label() . ' (' . $page->toUrl()->toString() . ')' . PHP_EOL;
  $components = $page->get('components')->getValue();
  echo '  компонентов: ' . count($components) . PHP_EOL;
  $found = 0;
  foreach ($components as $component) {
    $inputs = $component['inputs'] ?? [];
    if (is_string($inputs)) {
      $inputs = json_decode($inputs, TRUE) ?: [];
    }
    foreach ($inputs as $key => $value) {
      if (!is_array($value) || !array_key_exists('target_id', (array) $value)) {
        continue;
      }
      $target = $value['target_id'];
      $media = is_numeric($target)
        ? \Drupal::entityTypeManager()->getStorage('media')->load((int) $target)
        : NULL;
      $file_url = NULL;
      if ($media !== NULL && $media->hasField('field_media_image') && !$media->get('field_media_image')->isEmpty()) {
        $file = $media->get('field_media_image')->entity;
        $file_url = $file ? \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri()) : NULL;
      }
      echo sprintf(
        "  проп %-12s target_id=%-6s media=%s url=%s%s",
        $key,
        is_scalar($target) ? (string) $target : gettype($target),
        $media ? $media->bundle() . ':' . $media->id() : '—',
        $file_url ?? '—',
        PHP_EOL,
      );
      $found++;
    }
  }
  echo '  картинок найдено: ' . $found . PHP_EOL;
}
