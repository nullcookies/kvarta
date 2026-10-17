<?php

declare(strict_types=1);

namespace Drupal\kvarta_seo\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\Response;

/**
 * Карта сайта: /sitemap.xml.
 *
 * Отдаём все опубликованные Canvas-страницы и материалы. Для лендинга это одна
 * страница, но карта сразу рассчитана на рост сайта и не тянет лишних
 * зависимостей (модуль simple_sitemap для одной страницы избыточен).
 */
final class SitemapController extends ControllerBase {

  /**
   * Собирает XML-карту сайта.
   */
  public function build(): Response {
    $entries = [];

    $front_url = Url::fromRoute('<front>', [], ['absolute' => TRUE])->toString();
    $entries[$front_url] = $this->frontPageLastMod();

    foreach (['canvas_page', 'node'] as $entity_type_id) {
      $storage = $this->entityTypeManager()->getStorage($entity_type_id);
      foreach ($storage->loadMultiple() as $entity) {
        if (method_exists($entity, 'isPublished') && !$entity->isPublished()) {
          continue;
        }
        try {
          $url = $entity->toUrl('canonical', ['absolute' => TRUE])->toString();
        }
        catch (\Throwable) {
          continue;
        }
        $entries[$url] = max($entries[$url] ?? 0, (int) ($entity->getChangedTime() ?? 0));
      }
    }

    $xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    $xml .= "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";
    foreach ($entries as $url => $last_mod) {
      $xml .= "  <url>\n";
      $xml .= '    <loc>' . $this->escape($url) . "</loc>\n";
      if ($last_mod > 0) {
        $xml .= '    <lastmod>' . gmdate('Y-m-d\TH:i:s+00:00', $last_mod) . "</lastmod>\n";
      }
      $xml .= "  </url>\n";
    }
    $xml .= "</urlset>\n";

    return new Response($xml, 200, [
      'Content-Type' => 'application/xml; charset=utf-8',
      'X-Robots-Tag' => 'noindex',
    ]);
  }

  /**
   * Время правки главной страницы.
   */
  private function frontPageLastMod(): int {
    $front = (string) $this->config('system.site')->get('page.front');
    if ($front === '') {
      return 0;
    }

    $internal = \Drupal::service('path_alias.manager')->getPathByAlias($front);
    if (preg_match('#/canvas_page/(\d+)#', $internal, $matches)) {
      $page = $this->entityTypeManager()->getStorage('canvas_page')->load((int) $matches[1]);
      return $page === NULL ? 0 : (int) $page->getChangedTime();
    }

    return 0;
  }

  /**
   * Экранирование значения для XML.
   */
  private function escape(string $value): string {
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
  }

}
