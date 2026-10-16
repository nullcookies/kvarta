<?php

/**
 * @file
 * Настройка OAuth-клиента Canvas CLI. Запуск:
 * ddev drush php:script scripts/dev/oauth-setup.php
 *
 * Создаёт (идемпотентно) клиента с client_id/cli и secret/secret — ровно те
 * значения, что ждёт canvas/.env, — с грантом client_credentials, скоупами
 * Canvas и пользователем-администратором.
 */

use Drupal\consumers\Entity\Consumer;

$config = \Drupal::configFactory()->getEditable('simple_oauth.settings');
// \Drupal::root() — это docroot (web/), а ключи лежат на уровень выше, вне
// docroot, чтобы не отдаваться веб-сервером.
$keys = dirname(\Drupal::root()) . '/.keys';

$config
  ->set('public_key', $keys . '/public.key')
  ->set('private_key', $keys . '/private.key')
  ->save();
echo 'simple_oauth.settings: ключи записаны (' . $keys . ')' . PHP_EOL;

// Поле scopes ссылается на сущности oauth2_scope, поэтому нужны их id,
// а не человекочитаемые имена вида canvas:js_component.
$scopes = [
  'canvas_js_component',
  'canvas_asset_library',
  'canvas_brand_kit',
  'canvas_content_template',
  'canvas_page_create',
  'canvas_page_read',
  'canvas_page_edit',
  'canvas_page_delete',
  'canvas_page_region',
  'canvas_page_variant',
  'canvas_media_view',
  'canvas_media_image_create',
  'canvas_media_document_create',
];

$storage = \Drupal::entityTypeManager()->getStorage('consumer');
$existing = $storage->loadByProperties(['client_id' => 'cli']);

echo 'Поля клиента: ' . implode(', ', array_keys(\Drupal::service('entity_field.manager')->getFieldDefinitions('consumer', 'consumer'))) . PHP_EOL;

if ($existing !== []) {
  $consumer = reset($existing);
  echo 'Клиент cli уже есть, обновляю настройки' . PHP_EOL;
}
else {
  $consumer = Consumer::create([
    'label' => 'Canvas CLI',
    'client_id' => 'cli',
  ]);
  echo 'Создаю клиента cli' . PHP_EOL;
}

$consumer->set('secret', 'secret');
$consumer->set('confidential', TRUE);
$consumer->set('is_default', FALSE);
$consumer->set('user_id', 1);
$consumer->set('description', 'Локальный клиент Canvas CLI для выгрузки компонентов и страниц.');
$consumer->set('grant_types', ['client_credentials']);
$consumer->set('scopes', $scopes);
$consumer->set('redirect', '');
$consumer->save();

echo 'Клиент: ' . $consumer->id() . ' (client_id=' . $consumer->get('client_id')->value . ')' . PHP_EOL;
echo 'Грант: ' . implode(', ', array_column($consumer->get('grant_types')->getValue(), 'value')) . PHP_EOL;
echo 'Скоупы: ' . implode(' ', array_column($consumer->get('scopes')->getValue(), 'value')) . PHP_EOL;
echo 'Пользователь: ' . $consumer->get('user_id')->target_id . PHP_EOL;
echo 'Скоупы в системе: ' . implode(' ', array_keys(\Drupal::entityTypeManager()->getStorage('oauth2_scope')->loadMultiple())) . PHP_EOL;
