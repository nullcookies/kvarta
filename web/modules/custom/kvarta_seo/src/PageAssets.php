<?php

declare(strict_types=1);

namespace Drupal\kvarta_seo;

use Drupal\canvas\Entity\ComponentTreeEntityInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Path\PathMatcherInterface;

/**
 * Находит ресурсы страницы, которые стоит подгрузить заранее.
 *
 * Canvas рендерит компоненты на клиенте, поэтому картинка первого экрана
 * начинает грузиться только после гидрации. Мы достаём её из компонентов
 * страницы и отдаём браузеру через <link rel="preload" as="image"> — это самый
 * дешёвый способ ускорить LCP, пока у Canvas нет серверного рендера.
 */
final class PageAssets {

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly FileUrlGeneratorInterface $fileUrlGenerator,
    private readonly PathMatcherInterface $pathMatcher,
    private readonly ThemeExtensionList $themeList,
  ) {}

  /**
   * URL картинки первого экрана (первое изображение в компонентах страницы).
   */
  public function heroImageUrl(): ?string {
    $page = $this->frontCanvasPage();
    if ($page === NULL) {
      return NULL;
    }

    foreach ($page->get('components')->getValue() as $component) {
      $inputs = $component['inputs'] ?? [];
      if (is_string($inputs)) {
        $inputs = json_decode($inputs, TRUE) ?: [];
      }
      foreach ($inputs as $value) {
        if (!is_array($value) || !isset($value['target_id'])) {
          continue;
        }
        $url = $this->mediaImageUrl($value['target_id']);
        if ($url !== NULL) {
          return $url;
        }
      }
    }

    return NULL;
  }

  /**
   * Файлы шрифтов активной темы для предзагрузки.
   *
   * @return array<int, string>
   *   Абсолютные URL файлов шрифтов.
   */
  public function fontUrls(): array {
    $theme = \Drupal::config('system.theme')->get('default');
    if (!is_string($theme) || $theme === '') {
      return [];
    }

    try {
      $path = $this->themeList->getPath($theme);
    }
    catch (\Throwable) {
      return [];
    }

    $fonts = [];
    foreach ([
      'assets/fonts/Oswald/Oswald-VariableFont_wght.ttf',
      'assets/fonts/Open_Sans/OpenSans-VariableFont_wdth,wght.ttf',
    ] as $relative) {
      if (is_file(DRUPAL_ROOT . '/' . $path . '/' . $relative)) {
        $fonts[] = $this->fileUrlGenerator->generateAbsoluteString($path . '/' . $relative);
      }
    }

    return $fonts;
  }

  /**
   * Страница Canvas, назначенная главной страницей сайта.
   */
  private function frontCanvasPage(): ?ComponentTreeEntityInterface {
    $entity = \Drupal::routeMatch()->getParameter('canvas_page');
    if ($entity instanceof ComponentTreeEntityInterface) {
      return $entity;
    }

    if (!$this->pathMatcher->isFrontPage()) {
      return NULL;
    }

    $front = (string) \Drupal::config('system.site')->get('page.front');
    if ($front === '') {
      return NULL;
    }

    // Разрешаем путь главной через роутер: так мы не зависим от внутреннего
    // формата ссылки Canvas (/page/{id}) и получаем сущность из параметров
    // маршрута entity.canvas_page.canonical.
    try {
      $result = \Drupal::service('router.no_access_checks')->match('/' . ltrim($front, '/'));
    }
    catch (\Throwable) {
      return NULL;
    }

    $page = $result['canvas_page'] ?? NULL;
    return $page instanceof ComponentTreeEntityInterface ? $page : NULL;
  }

  /**
   * URL картинки медиа-сущности.
   */
  private function mediaImageUrl(mixed $target_id): ?string {
    if (!is_numeric($target_id)) {
      return NULL;
    }

    $media = $this->entityTypeManager->getStorage('media')->load((int) $target_id);
    if ($media === NULL || !$media->hasField('field_media_image') || $media->get('field_media_image')->isEmpty()) {
      return NULL;
    }

    $file = $media->get('field_media_image')->entity;
    if ($file === NULL) {
      return NULL;
    }

    return $this->fileUrlGenerator->generateAbsoluteString($file->getFileUri());
  }

}
