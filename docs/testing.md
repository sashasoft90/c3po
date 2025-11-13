# testing guide

Руководство по настройке и запуску тестов для проекта C3PO.

## Содержание

- [Вывод результатов тестов](#вывод-результатов-тестов)
- [Установка](#установка)
- [Структура тестов](#структура-тестов)
- [Запуск тестов](#запуск-тестов)
- [Покрытие тестами](#покрытие-тестами)
- [Написание новых тестов](#написание-новых-тестов)
- [Интеграция с CI/CD](#интеграция-с-cicd)
- [Решение проблем](#решение-проблем)
- [Best Practices](#best-practices)
- [Ресурсы](#ресурсы)

## Вывод результатов тестов

Все результаты тестов сохраняются в директории `.log/`:

- **Unit тесты**: `.log/unit/`
  - `results.json` - результаты в JSON формате
  - `index.html` - HTML отчет
  - `coverage/` - отчеты покрытия кода
- **E2E тесты**: `.log/e2e/`
  - `html-report/` - HTML отчет со скриншотами
  - `results.json` - результаты в JSON формате
  - `test-results/` - артефакты тестов (traces, screenshots, videos)

Директория `.log/` игнорируется в git.

## Установка

Сначала установите зависимости для тестирования:

```bash
pnpm add -D vitest @vitest/ui @testing-library/svelte @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test
```

Для Playwright также установите браузеры:

```bash
pnpm exec playwright install
```

## Структура тестов

В проекте используется два типа тестов:

### 1. Unit/Integration тесты (Vitest + Testing Library)

- **Расположение**: `src/**/*.{test,spec}.ts`
- **Назначение**: Тестирование отдельных компонентов и их логики
- **Фреймворк**: Vitest + @testing-library/svelte

#### Примеры тестовых файлов:
- `src/lib/features/calendar/ui/calendar.test.ts` - тесты для Calendar feature
- `src/lib/widgets/calendar-navigation/ui/calendar-navigation.test.ts` - тесты для CalendarNavigation widget

### 2. E2E тесты (Playwright)

- **Расположение**: `tests/**/*.spec.ts`
- **Назначение**: Тестирование полных пользовательских сценариев в реальном браузере
- **Фреймворк**: Playwright

#### Примеры тестовых файлов:
- `tests/calendar-navigation.spec.ts` - E2E тесты для навигации по календарю

## Запуск тестов

### Unit тесты

```bash
# Запуск тестов в watch mode (рекомендуется для разработки)
pnpm test

# Запуск тестов один раз
pnpm test:run

# Запуск тестов с UI
pnpm test:ui

# Запуск тестов с отчетом покрытия
pnpm test:coverage
```

### E2E тесты

```bash
# Запуск E2E тестов
pnpm test:e2e

# Запуск E2E тестов с UI режимом
pnpm test:e2e:ui

# Запуск E2E тестов в debug режиме
pnpm test:e2e:debug
```

## Покрытие тестами

### Тесты Calendar Feature

`calendar.test.ts` включает тесты для:
- ✅ Отрисовки с текущей датой по умолчанию
- ✅ Отображения предоставленного значения даты
- ✅ Открытия drawer по клику на trigger
- ✅ Внешней привязки значения через `bind:value`
- ✅ Применения кастомного className

### Тесты Calendar Navigation Widget

`calendar-navigation.test.ts` включает тесты для:
- ✅ Отрисовки календаря с кнопками навигации влево/вправо
- ✅ Отображения текущей даты по умолчанию
- ✅ Навигации на предыдущий день (левая кнопка)
- ✅ Навигации на следующий день (правая кнопка)
- ✅ Множественных последовательных кликов
- ✅ Навигации назад и вперед
- ✅ Обработки границ месяцев
- ✅ Поддержки кастомных className и ID

### E2E тесты

`calendar-navigation.spec.ts` включает тесты для:
- ✅ Визуального присутствия кнопок навигации и календаря
- ✅ Начального отображения текущей даты
- ✅ Навигации на предыдущий/следующий день через клики
- ✅ Обработки множественных кликов
- ✅ Комбинированной навигации назад/вперед
- ✅ Пересечения границ месяцев (40 дней назад)
- ✅ Открытия drawer календаря
- ✅ Синхронизации с выбором даты в календаре
- ✅ Правильной flex-row раскладки

## Написание новых тестов

### Пример Unit теста

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import MyComponent from './my-component.svelte';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(MyComponent, {
      props: {
        someProp: 'value'
      }
    });

    expect(screen.getByText('value')).toBeInTheDocument();
  });
});
```

### Пример E2E теста

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-page');
  });

  test('should perform user action', async ({ page }) => {
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Интеграция с CI/CD

Тесты могут быть интегрированы в CI/CD пайплайны:

```yaml
# Пример GitHub Actions workflow
- name: Run unit tests
  run: pnpm test:run

- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps

- name: Run E2E tests
  run: pnpm test:e2e
```

## Решение проблем

### Проблемы с Vitest

Если тесты не запускаются, убедитесь что:
1. Все зависимости установлены: `pnpm install`
2. TypeScript типы корректны: `pnpm check`
3. Конфигурация Vitest валидна: проверьте `vitest.config.ts`

### Проблемы с Playwright

Если E2E тесты падают:
1. Убедитесь что браузеры установлены: `pnpm exec playwright install`
2. Проверьте что dev сервер запущен на правильном порту (5173)
3. Увеличьте timeout если тесты нестабильные: добавьте `timeout: 60000` к тесту

### Известные ограничения

#### Chromium E2E тесты

Некоторые тесты пропущены для Chromium из-за известных проблем с Playwright:

1. **Rapid clicks** - тесты с множественными быстрыми кликами пропущены из-за проблем timing
2. **Drawer Portal** - тесты с vaul-svelte drawer пропущены из-за проблем рендеринга Portal

Эти ограничения не влияют на реальную работу приложения в браузере.

## Best Practices

1. **Тестируйте поведение, а не реализацию** - фокусируйтесь на том, что видят и делают пользователи
2. **Используйте Testing Library queries** - предпочитайте `getByRole`, `getByLabelText` вместо деталей реализации
3. **Изолируйте тесты** - каждый тест должен работать независимо
4. **Мокайте внешние зависимости** - не делайте реальные API вызовы в unit тестах
5. **Используйте понятные описания тестов** - делайте ясным, что тестируется
6. **Следуйте паттерну AAA** - Arrange, Act, Assert

## Ресурсы

- [Документация Vitest](https://vitest.dev/)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Документация Playwright](https://playwright.dev/)
