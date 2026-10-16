<?php

/**
 * @file
 * OG-превью лендинга: картинка 1200×630 и метатеги сайта. Запуск:
 * ddev drush php:script scripts/dev/setup-metatags.php
 *
 * Картинка рисуется GD шрифтом самой темы (Oswald), поэтому превью выглядит
 * частью сайта, а не заглушкой. Файл кладём в public://og/.
 */

$file_system = \Drupal::service('file_system');
$theme_path = \Drupal::service('extension.list.theme')->getPath('the_coffee_shop');
$font = DRUPAL_ROOT . '/' . $theme_path . '/assets/fonts/Oswald/Oswald-VariableFont_wght.ttf';

if (!is_file($font)) {
  echo 'Не найден шрифт темы: ' . $font . PHP_EOL;
  return;
}

$width = 1200;
$height = 630;
$image = imagecreatetruecolor($width, $height);
imageantialias($image, TRUE);

$ink = imagecolorallocate($image, 0x30, 0x27, 0x1c);
$brand = imagecolorallocate($image, 0xc7, 0xa1, 0x7a);
$cream = imagecolorallocate($image, 0xeb, 0xe7, 0xde);
$muted = imagecolorallocate($image, 0xaa, 0x88, 0x65);

imagefilledrectangle($image, 0, 0, $width, $height, $ink);

// Карамельная рамка — узнаваемый приём темы.
imagesetthickness($image, 6);
imagerectangle($image, 40, 40, $width - 40, $height - 40, $brand);
imagesetthickness($image, 1);

$font_file = $font;

// Бренд.
imagettftext($image, 76, 0, 80, 200, $cream, $font_file, 'КВАРТА');
// Подпись.
imagettftext($image, 26, 0, 82, 250, $brand, $font_file, 'ОБЖАРКА КОФЕ · МИНСК');
// Оффер в две строки.
imagettftext($image, 40, 0, 80, 380, $cream, $font_file, 'ОБЖАРИВАЕМ В ЧЕТВЕРГ —');
imagettftext($image, 40, 0, 80, 440, $cream, $font_file, 'ПРИВОЗИМ В ПЯТНИЦУ');
// Факты.
imagettftext($image, 24, 0, 80, 530, $muted, $font_file, 'ПАРТИИ ПО 5 КГ  ·  ЗЕРНО У ВАС НА 1–3 ДЕНЬ  ·  54 BYN/МЕС');

$directory = 'public://og';
$file_system->prepareDirectory($directory, $file_system::CREATE_DIRECTORY | $file_system::MODIFY_PERMISSIONS);
$uri = $directory . '/kvarta-og.png';
imagepng($image, $file_system->realpath($uri));
imagedestroy($image);

$url = \Drupal::service('file_url_generator')->generateAbsoluteString($uri);
echo 'OG-картинка: ' . $url . PHP_EOL;

$description = 'Мастерская Ани и Дмитрия: партии по 5 кг, зерно у вас на 1–3 день после обжарки. Подписка 54 BYN/мес, доставка по Минску по пятницам.';
$title = 'Кварта — обжарка кофе в Минске. Обжариваем в четверг, привозим в пятницу';

/** @var \Drupal\Core\Config\Config $config */
$config = \Drupal::configFactory()->getEditable('metatag.metatag_defaults.global');
$tags = $config->get('tags') ?? [];
// Присваиваем напрямую: в поставке Drupal CMS эти ключи уже заданы токенами
// (например og_image ссылается на медиаполе страницы), а `+=` их не заменяет.
$tags['canonical_url'] = '[current-page:url]';
$tags['title'] = '[current-page:title] | [site:name]';
$tags['description'] = $description;
$tags['og_site_name'] = '[site:name]';
$tags['og_type'] = 'website';
$tags['og_title'] = $title;
$tags['og_description'] = $description;
$tags['og_url'] = '[current-page:url]';
$tags['og_image'] = $url;
$tags['og_image_width'] = '1200';
$tags['og_image_height'] = '630';
$tags['og_image_type'] = 'image/png';
$tags['twitter_cards_type'] = 'summary_large_image';
$tags['twitter_cards_title'] = $title;
$tags['twitter_cards_description'] = $description;
$tags['twitter_cards_image'] = $url;
$config->set('tags', $tags)->save();

echo 'Метатеги global: обновлены' . PHP_EOL;

// Для главной страницы — свой набор, без «| Кварта» в заголовке.
$front = \Drupal::configFactory()->getEditable('metatag.metatag_defaults.front');
$front_tags = $front->get('tags') ?? [];
$front_tags['title'] = $title;
$front_tags['description'] = $description;
$front_tags['canonical_url'] = '[site:url]';
$front_tags['og_title'] = $title;
$front_tags['og_description'] = $description;
$front_tags['og_url'] = '[site:url]';
$front_tags['og_image'] = $url;
$front_tags['og_image_width'] = '1200';
$front_tags['og_image_height'] = '630';
$front_tags['og_image_type'] = 'image/png';
$front_tags['twitter_cards_type'] = 'summary_large_image';
$front_tags['twitter_cards_title'] = $title;
$front_tags['twitter_cards_description'] = $description;
$front_tags['twitter_cards_image'] = $url;
$front->set('tags', $front_tags)->save();

echo 'Метатеги front: обновлены' . PHP_EOL;
echo 'Заголовок сайта: ' . \Drupal::config('system.site')->get('name') . PHP_EOL;
echo 'Слоган сайта: ' . \Drupal::config('system.site')->get('slogan') . PHP_EOL;
