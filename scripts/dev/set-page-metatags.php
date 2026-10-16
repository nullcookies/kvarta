<?php

/**
 * @file
 * Метатеги самой Canvas-страницы (они сильнее общих настроек metatag).
 * Запуск: ddev drush php:script scripts/dev/set-page-metatags.php
 */

$storage = \Drupal::entityTypeManager()->getStorage('canvas_page');
$fields = \Drupal::service('entity_field.manager')->getFieldDefinitions('canvas_page', 'canvas_page');
echo 'Поля страницы: ' . implode(', ', array_keys($fields)) . PHP_EOL;

$page = NULL;
foreach ($storage->loadMultiple() as $candidate) {
  if ($candidate->toUrl()->toString() === '/kvarta') {
    $page = $candidate;
  }
}

if ($page === NULL) {
  echo 'Страница /kvarta не найдена.' . PHP_EOL;
  return;
}

if (!$page->hasField('metatags')) {
  echo 'У сущности нет поля metatags — теги задаются только глобально.' . PHP_EOL;
  return;
}

$image = \Drupal::service('file_url_generator')
  ->generateAbsoluteString('public://og/kvarta-og.png');

$title = 'Кварта — обжарка кофе в Минске. Обжариваем в четверг, привозим в пятницу';
$description = 'Мастерская Ани и Дмитрия: партии по 5 кг, зерно у вас на 1–3 день после обжарки. Подписка 54 BYN/мес, доставка по Минску по пятницам.';

$tags = [
  'title' => $title,
  'description' => $description,
  'canonical_url' => '[current-page:url]',
  'og_title' => $title,
  'og_description' => $description,
  'og_image' => $image,
  'og_image_width' => '1200',
  'og_image_height' => '630',
  'og_image_type' => 'image/png',
  'twitter_cards_type' => 'summary_large_image',
  'twitter_cards_title' => $title,
  'twitter_cards_description' => $description,
  'twitter_cards_image' => $image,
];

// У Canvas-страницы есть оба поля: metatag (поле модуля Metatag) и metatags
// (поле Canvas). Заполняем те, что реально существуют.
foreach (['metatag', 'metatags'] as $field_name) {
  if (!$page->hasField($field_name)) {
    continue;
  }
  $definition = $page->get($field_name)->getFieldDefinition();
  echo sprintf(
    'Поле %s: тип %s%s',
    $field_name,
    $definition->getType(),
    PHP_EOL,
  );
  $page->set($field_name, $tags);
}

$page->save();
echo 'Метатеги страницы обновлены, картинка: ' . $image . PHP_EOL;
