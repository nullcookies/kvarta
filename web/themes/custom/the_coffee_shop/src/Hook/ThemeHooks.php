<?php

declare(strict_types=1);

namespace Drupal\the_coffee_shop\Hook;

use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\wordpal\Theme\BodyClasses;
use Drupal\wordpal\Theme\FormButtons;

/**
 * Hook implementations of the generated theme.
 */
final class ThemeHooks {

  use StringTranslationTrait;

  public function __construct(
    private readonly BodyClasses $bodyClasses,
    private readonly ThemeSettingsProvider $themeSettings,
    private readonly ThemeExtensionList $themeExtensionList,
  ) {}

  /**
   * Prints WordPress's body classes.
   */
  #[Hook('preprocess_html')]
  public function preprocessHtml(array &$variables): void {
    $this->bodyClasses->preprocessHtml($variables);
  }

  /**
   * Makes the global library load the selected style variation.
   */
  #[Hook('library_info_alter')]
  public function libraryInfoAlter(array &$libraries, string $extension): void {
    if ($extension === 'the_coffee_shop') {
      $libraries['global']['dependencies'][] = 'the_coffee_shop/variation.' . $this->themeSettings->getSetting('style_variation', 'the_coffee_shop');
    }
  }

  /**
   * Styles Drupal's form buttons.
   */
  #[Hook('preprocess_input')]
  public function preprocessInput(array &$variables): void {
    FormButtons::preprocessInput($variables);
  }

  /**
   * Removes the Logo display checkbox and adds the style variation select.
   *
   * The hook also runs while this theme is active and another theme's
   * settings are edited. The select shows when there is a choice to make.
   */
  #[Hook('form_system_theme_settings_alter')]
  public function formSystemThemeSettingsAlter(array &$form): void {
    if ($form['config_key']['#value'] !== 'the_coffee_shop.settings') {
      return;
    }
    unset($form['theme_settings']['toggle_logo']);
    $variations = $this->themeExtensionList->getExtensionInfo('the_coffee_shop')['wordpal_variations'];
    if (count($variations) > 1) {
      $form['style_variation'] = [
        '#type' => 'select',
        '#title' => $this->t('Style variation'),
        '#options' => $variations,
        '#default_value' => $this->themeSettings->getSetting('style_variation', 'the_coffee_shop'),
        '#weight' => -10,
      ];
    }
  }

}
