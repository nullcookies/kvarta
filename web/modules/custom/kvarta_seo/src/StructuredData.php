<?php

declare(strict_types=1);

namespace Drupal\kvarta_seo;

use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Url;

/**
 * Собирает граф JSON-LD для главной страницы лендинга.
 */
final class StructuredData {

  /**
   * Возвращает граф Schema.org для страницы.
   *
   * @param string|null $image_url
   *   Абсолютный URL картинки первого экрана, если она есть.
   *
   * @return array<string, mixed>
   */
  public static function build(?string $image_url = NULL): array {
    $site_url = Url::fromRoute('<front>', [], ['absolute' => TRUE])->toString();
    $logo_url = $image_url ?? self::defaultImageUrl();

    $cafe = [
      '@type' => 'CafeOrCoffeeShop',
      '@id' => $site_url . '#business',
      'name' => BusinessData::NAME,
      'description' => BusinessData::DESCRIPTION,
      'url' => $site_url,
      'telephone' => BusinessData::PHONE,
      'email' => BusinessData::EMAIL,
      'priceRange' => '18–54 BYN',
      'currenciesAccepted' => 'BYN',
      'paymentAccepted' => 'Наличные, банковская карта, безналичный перевод',
      'address' => [
        '@type' => 'PostalAddress',
        'streetAddress' => BusinessData::STREET,
        'addressLocality' => BusinessData::CITY,
        'addressCountry' => BusinessData::COUNTRY,
      ],
      // Мастерская работает на самовывоз и доставку по городу.
      'areaServed' => [
        '@type' => 'City',
        'name' => BusinessData::CITY,
      ],
      'sameAs' => [
        'https://instagram.com/',
        'https://t.me/',
      ],
      'makesOffer' => [],
    ];

    if ($logo_url !== NULL) {
      $cafe['image'] = $logo_url;
      $cafe['logo'] = $logo_url;
    }

    foreach (BusinessData::OPENING_HOURS as $slot) {
      $cafe['openingHoursSpecification'][] = [
        '@type' => 'OpeningHoursSpecification',
        'dayOfWeek' => $slot['days'],
        'opens' => $slot['opens'],
        'closes' => $slot['closes'],
      ];
    }

    $items = [];
    foreach (BusinessData::PRODUCTS as $index => $product) {
      $position = $index + 1;
      $offer = [
        '@type' => 'Offer',
        'price' => $product['price'],
        'priceCurrency' => 'BYN',
        'availability' => 'https://schema.org/InStock',
        'url' => $site_url . '#lead',
        'seller' => ['@id' => $site_url . '#business'],
      ];

      $items[] = [
        '@type' => 'ListItem',
        'position' => $position,
        'item' => [
          '@type' => 'Product',
          'name' => $product['name'],
          'description' => $product['description'],
          'category' => 'Кофе',
          'weight' => [
            '@type' => 'QuantitativeValue',
            'value' => $product['weight'],
          ],
          'brand' => [
            '@type' => 'Brand',
            'name' => BusinessData::NAME,
          ],
          'offers' => $offer,
        ],
      ];

      // Товары дублируем в makesOffer: так цены видны и от карточки бизнеса.
      $cafe['makesOffer'][] = [
        '@type' => 'Offer',
        'itemOffered' => [
          '@type' => 'Product',
          'name' => $product['name'],
        ],
        'price' => $product['price'],
        'priceCurrency' => 'BYN',
      ];
    }

    return [
      '@context' => 'https://schema.org',
      '@graph' => [
        [
          '@type' => 'WebSite',
          '@id' => $site_url . '#website',
          'url' => $site_url,
          'name' => BusinessData::NAME,
          'inLanguage' => 'ru-BY',
          'publisher' => ['@id' => $site_url . '#business'],
        ],
        $cafe,
        [
          '@type' => 'ItemList',
          '@id' => $site_url . '#assortment',
          'name' => 'Ассортимент обжарки «Кварта»',
          'numberOfItems' => count($items),
          'itemListElement' => $items,
        ],
      ],
    ];
  }

  /**
   * Картинка по умолчанию — сгенерированное OG-превью.
   */
  private static function defaultImageUrl(): ?string {
    $uri = 'public://og/kvarta-og.png';
    // В Drupal 11 у файловой системы нет метода exists(): проверяем реальный путь.
    $real_path = \Drupal::service('file_system')->realpath($uri);
    if ($real_path === FALSE || !is_file($real_path)) {
      return NULL;
    }
    $url = \Drupal::service('file_url_generator')->generateAbsoluteString($uri);
    return UrlHelper::isValid($url, TRUE) ? $url : NULL;
  }

}
