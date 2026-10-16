/*
 * Заплатка для @drupal-canvas/cli 0.26.x на Windows.
 *
 * В сборщике CLI есть эвристика «голого» импорта:
 *
 *   function isBareImport(source) {
 *     return !source.startsWith(".") && !source.startsWith("/") && ...
 *   }
 *
 * Входные файлы компонентов CLI передаёт как путь Windows (`E:\проект\...`)
 * или как путь от корня проекта (`src/components/button/index.jsx`). Оба
 * варианта не начинаются с точки или слэша, поэтому эвристика считает их
 * «голыми» импортами, помечает внешними — и сборка падает:
 *
 *   Error while transforming JavaScript:
 *   Entry module "src/components/button/index.jsx" cannot be external.
 *
 * На Linux/macOS такой проблемы нет: там путь начинается со слэша.
 *
 * Скрипт правит isBareImport, добавляя распознавание путей Windows и путей
 * от корня проекта. Запускается автоматически из `npm run postinstall`,
 * повторный запуск безопасен. Когда CLI починят, скрипт просто ничего не
 * найдёт и тихо выйдет — тогда его можно удалить вместе с postinstall.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let cliPath;
try {
  cliPath = require.resolve('@drupal-canvas/cli/dist/index.js');
} catch {
  console.log('[patch-canvas-cli] @drupal-canvas/cli не найден — пропускаем.');
  process.exit(0);
}

if (!existsSync(cliPath)) {
  console.log('[patch-canvas-cli] dist/index.js не найден — пропускаем.');
  process.exit(0);
}

const original = `function isBareImport(source) {
  return !source.startsWith(".") && !source.startsWith("/") && !source.startsWith("\\0") && !source.includes("\\0");
}`;

const patched = `function isBareImport(source) {
  // Патч для Windows: пути вида "E:\\\\..." и пути от корня проекта
  // ("src/...", "components/...") — это файлы, а не пакеты из node_modules.
  if (/^[a-zA-Z]:[\\\\/]/.test(source) || source.startsWith("\\\\\\\\")) {
    return false;
  }
  if (source.startsWith("src/") || source.startsWith("components/") || source.startsWith("node_modules/")) {
    return false;
  }
  return !source.startsWith(".") && !source.startsWith("/") && !source.startsWith("\\0") && !source.includes("\\0");
}`;

const code = readFileSync(cliPath, 'utf8');

if (code.includes('Патч для Windows')) {
  console.log('[patch-canvas-cli] уже применён.');
  process.exit(0);
}

if (!code.includes(original)) {
  console.log(
    '[patch-canvas-cli] не найдена ожидаемая реализация isBareImport — вероятно, CLI обновили и патч больше не нужен.',
  );
  process.exit(0);
}

writeFileSync(cliPath, code.replace(original, patched), 'utf8');
console.log('[patch-canvas-cli] применён: isBareImport понимает пути Windows.');
