<?php

/**
 * @file
 * Публикация Canvas-страниц лендинга и уборка дублей. Запуск:
 * ddev drush php:script scripts/dev/publish-canvas-pages.php
 *
 * Canvas CLI приезжает страницы черновиками (в спецификации страницы нет поля
 * status), поэтому публикуем их здесь. Сущность грузится целиком и сохраняется
 * как есть — иначе можно потерять компоненты страницы.
 */

$storage = \Drupal::entityTypeManager()->getStorage('canvas_page');

/** @var \Drupal\canvas\Entity\CanvasPage[] $pages */
$pages = $storage->loadMultiple();

$keep = NULL;
foreach ($pages as $page) {
  if (!str_contains($page->label(), 'Кварта')) {
    continue;
  }
  // Оставляем страницу с коротким адресом /kvarta, остальные — дубли
  // неудачных попыток публикации.
  if ($page->toUrl()->toString() === '/kvarta') {
    $keep = $page;
    continue;
  }
  echo 'Удаляю дубль: #' . $page->id() . ' ' . $page->label() . ' (' . $page->toUrl()->toString() . ')' . PHP_EOL;
  try {
    $page->delete();
  }
  catch (\Throwable $e) {
    // Ядро Drupal 11.4 падает в menu_link_content при удалении алиаса
    // (pathAliasDelete передаёт NULL вместо строки). Дубль не критичен:
    // сообщаем и идём дальше, чтобы публикация основной страницы состоялась.
    echo '  Не удалось удалить целиком: ' . $e->getMessage() . PHP_EOL;
  }
}

if ($keep === NULL) {
  echo 'Страница «Кварта» не найдена.' . PHP_EOL;
  return;
}

if (!$keep->isPublished()) {
  $keep->setPublished()->save();
  echo 'Опубликована: #' . $keep->id() . ' ' . $keep->label() . PHP_EOL;
}
else {
  echo 'Уже опубликована: #' . $keep->id() . PHP_EOL;
}

echo 'Компонентов на странице: ' . count($keep->get('components')->getValue()) . PHP_EOL;
echo 'Адрес: ' . $keep->toUrl()->toString() . PHP_EOL;

foreach ($storage->loadMultiple() as $page) {
  echo '  canvas_page #' . $page->id() . ' | ' . $page->label() . ' | '
    . $page->toUrl()->toString() . ' | ' . ($page->isPublished() ? 'published' : 'draft') . PHP_EOL;
}
