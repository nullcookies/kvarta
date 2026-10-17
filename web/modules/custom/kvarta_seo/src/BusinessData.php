<?php

declare(strict_types=1);

namespace Drupal\kvarta_seo;

/**
 * Данные о мастерской и ассортименте для структурированной разметки.
 *
 * Единственный источник этих значений — docs/CONTENT.md; здесь они собраны в
 * одном месте, чтобы JSON-LD и тексты лендинга не разъезжались.
 */
final class BusinessData {

  /**
   * Название мастерской.
   */
  public const NAME = 'Кварта';

  /**
   * Короткое описание для поисковых систем.
   */
  public const DESCRIPTION = 'Мастерская обжарки кофе в Минске: партии по 5 кг, зерно у вас на 1–3 день после обжарки. Подписка 54 BYN/мес, доставка по Минску по пятницам.';

  /**
   * Телефон в формате E.164 и в человеческом виде.
   */
  public const PHONE = '+375291234567';

  public const PHONE_DISPLAY = '+375 (29) 123-45-67';

  /**
   * Почта мастерской.
   */
  public const EMAIL = 'hello@kvarta.by';

  /**
   * Адрес самовывоза.
   */
  public const STREET = 'ул. Короля, 9';

  public const CITY = 'Минск';

  public const COUNTRY = 'BY';

  /**
   * Часы работы: пн–пт 8:00–20:00, сб–вс 10:00–18:00.
   */
  public const OPENING_HOURS = [
    ['days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 'opens' => '08:00', 'closes' => '20:00'],
    ['days' => ['Saturday', 'Sunday'], 'opens' => '10:00', 'closes' => '18:00'],
  ];

  /**
   * Ассортимент: название, описание, вес, цена в BYN.
   *
   * @var array<int, array{name: string, description: string, weight: string, price: string}>
   */
  public const PRODUCTS = [
    [
      'name' => 'Эфиопия Иргачеффе',
      'description' => 'Цветочный, бергамот, светлая обжарка. 250 г.',
      'weight' => '250 г',
      'price' => '32.00',
    ],
    [
      'name' => 'Колумбия Уила',
      'description' => 'Карамель, красное яблоко. 250 г.',
      'weight' => '250 г',
      'price' => '29.00',
    ],
    [
      'name' => 'Бразилия Серрадо',
      'description' => 'Орех, шоколад, под эспрессо. 250 г.',
      'weight' => '250 г',
      'price' => '26.00',
    ],
    [
      'name' => 'Дрип-пакеты, ассорти',
      'description' => 'Десять дрип-пакетов, чтобы взять кофе в дорогу.',
      'weight' => '10 шт',
      'price' => '18.00',
    ],
    [
      'name' => 'Подписка на кофе',
      'description' => 'Две пачки по 250 г раз в месяц, доставка по Минску бесплатно.',
      'weight' => '2 × 250 г',
      'price' => '54.00',
    ],
  ];

}
