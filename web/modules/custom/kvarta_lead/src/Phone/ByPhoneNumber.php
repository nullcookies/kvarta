<?php

declare(strict_types=1);

namespace Drupal\kvarta_lead\Phone;

/**
 * Нормализация и проверка белорусских телефонных номеров.
 *
 * Принимаем то, как люди реально пишут номера: +375 (29) 123-45-67,
 * 8029 1234567, 375291234567, 29 123 45 67. На выходе — E.164 (+375XXXXXXXXX)
 * и «человеческий» вид для писем и списка заявок.
 */
final class ByPhoneNumber {

  /**
   * Код страны.
   */
  public const COUNTRY_CODE = '375';

  /**
   * Коды операторов мобильной связи и зоновые коды областей Беларуси.
   */
  public const AREA_CODES = [
    // Мобильные операторы.
    '25', '29', '33', '44',
    // Минск и Минская область.
    '17',
    // Области.
    '15', '16', '21', '22', '23',
  ];

  /**
   * Проверяет и нормализует номер.
   *
   * @return array{valid: bool, e164: string, pretty: string, error_key: string}
   *   Результат проверки: error_key пустой, если номер принят.
   */
  public function validate(string $raw): array {
    $raw = trim($raw);
    if ($raw === '') {
      return $this->fail('empty');
    }

    $digits = (string) preg_replace('/\D+/', '', $raw);
    if ($digits === '') {
      return $this->fail('empty');
    }

    $national = $this->toNational($digits);
    if ($national === NULL) {
      return $this->fail('foreign');
    }

    if (strlen($national) !== 9) {
      return $this->fail('length');
    }

    $code = substr($national, 0, 2);
    if (!in_array($code, self::AREA_CODES, TRUE)) {
      return $this->fail('code');
    }

    return [
      'valid' => TRUE,
      'e164' => '+' . self::COUNTRY_CODE . $national,
      'pretty' => $this->pretty($code, $national),
      'error_key' => '',
    ];
  }

  /**
   * Приводит введённые цифры к национальному номеру (9 цифр) или NULL.
   */
  private function toNational(string $digits): ?string {
    // 375XXXXXXXXX — международный формат.
    if (str_starts_with($digits, self::COUNTRY_CODE)) {
      return substr($digits, 3);
    }
    // 80XXXXXXXXX — внутрибелорусский междугородний префикс.
    if (str_starts_with($digits, '80') && strlen($digits) === 11) {
      return substr($digits, 2);
    }
    // 0XXXXXXXXX — номер с ведущим нулём.
    if (str_starts_with($digits, '0') && strlen($digits) === 10) {
      return substr($digits, 1);
    }
    // XXXXXXXXX — номер без кода страны.
    if (strlen($digits) === 9) {
      return $digits;
    }
    return NULL;
  }

  /**
   * Человеческий вид номера: +375 (29) 123-45-67.
   */
  private function pretty(string $code, string $national): string {
    return sprintf(
      '+%s (%s) %s-%s-%s',
      self::COUNTRY_CODE,
      $code,
      substr($national, 2, 3),
      substr($national, 5, 2),
      substr($national, 7, 2),
    );
  }

  /**
   * Результат с ошибкой.
   *
   * @return array{valid: bool, e164: string, pretty: string, error_key: string}
   */
  private function fail(string $key): array {
    return ['valid' => FALSE, 'e164' => '', 'pretty' => '', 'error_key' => $key];
  }

  /**
   * Подсказка для человека по ключу ошибки.
   */
  public static function hint(string $error_key): string {
    return match ($error_key) {
      'empty' => 'Укажите телефон — менеджер перезвонит и подтвердит заказ.',
      'length' => 'В номере должно быть 9 цифр после кода +375. Пример: +375 (29) 123-45-67.',
      'foreign' => 'Мы работаем только с белорусскими номерами: +375 (29) 123-45-67.',
      'code' => 'Такого кода оператора в Беларуси нет. Проверьте номер: +375 (29) 123-45-67.',
      default => 'Проверьте номер телефона. Пример: +375 (29) 123-45-67.',
    };
  }

}
