# contributing guide

Руководство по разработке проекта C3PO.

## Содержание

- [Начало работы](#начало-работы)
- [Workflow разработки](#workflow-разработки)
- [Git Flow](#git-flow)
- [Code Review](#code-review)
- [Naming Conventions](#naming-conventions)
- [Testing](#testing)

## Начало работы

### Требования

- **Node.js** 18+
- **pnpm** 10.19.0+

### Установка

```bash
# Клонирование репозитория
git clone git@github.com:sashasoft90/c3po.git
cd c3po

# Установка зависимостей
pnpm install
```

### Первый запуск

```bash
# Запуск dev-сервера
pnpm dev

# Откроется на http://localhost:5173
```

## Workflow разработки

### 1. Создание новой feature

```bash
# Создайте новую ветку от master
git checkout -b feature/C3PO-1/short-description

# Пример:
git checkout -b feature/C3PO-1/add-todo-list
```

### 2. Разработка

При разработке следуйте правилам:

1. **Feature-Sliced Design** - соблюдайте архитектуру ([см. architecture](./architecture.md))
2. **TypeScript** - весь код должен быть типизирован
3. **Svelte 5 runes** - используйте `$state`, `$derived`, `$effect`, `$props`
4. **TailwindCSS** - для стилей используйте utility classes

### 3. Проверка кода перед коммитом

```bash
# Type checking
pnpm check

# Linting (prettier + eslint)
pnpm lint

# Форматирование кода
pnpm format

# Build проверка
pnpm build
```

**Все проверки должны проходить успешно!**

### 4. Коммит изменений

Используйте формат:

```
C3PO-<number>/<Author>: краткое описание изменений
```

**Примеры:**

```bash
git commit -m "C3PO-1/AlSa: add calendar selector to planner page"
git commit -m "C3PO-1/AlSa: fix the select format in the calendar on windows"
git commit -m "C3PO-1/AlSa: format a full project"
```

**Рекомендации по описанию:**
- Используйте глаголы в повелительном наклонении: "add", "fix", "update", "refactor"
- Будьте конкретны и кратки
- Описывайте ЧТО сделано, а не КАК

### 5. Push и Pull Request

```bash
# Push в удалённый репозиторий
git push origin feature/C3PO-1/short-description

# Создайте Pull Request на GitHub
# Заполните описание PR (см. раздел ниже)
```

## Git Flow

### Ветки

- **`master`** - основная ветка, всегда стабильная
- **`feature/*`** - ветки для новых features
- **`fix/*`** - ветки для исправлений багов
- **`refactor/*`** - ветки для рефакторинга

### Naming Convention для веток

```
<type>/C3PO-<number>/<short-description>
```

**Примеры:**

```
feature/C3PO-1/add-user-authentication
fix/C3PO-2/calendar-timezone-bug
refactor/C3PO-3/extract-navigation-logic
```

### Работа с master

```bash
# Обновление локального master
git checkout master
git pull origin master

# Создание новой ветки от актуального master
git checkout -b feature/C3PO-1/description
```

### Rebase workflow (рекомендуется)

```bash
# Обновить ветку от актуального master
git checkout master
git pull origin master
git checkout feature/C3PO-1/description
git rebase master

# Разрешите конфликты если есть
# После разрешения:
git rebase --continue

# Force push (если ветка уже была запушена)
git push --force-with-lease origin feature/C3PO-1/description
```

## Pull Request Process

### Создание PR

1. **Title**: Краткое описание изменений

   ```
   Add calendar selector to planner page
   ```

2. **Description**: Заполните template:

   ```markdown
   ## Описание

   Краткое описание того, что делает PR.

   ## Изменения

   - Добавлен компонент Calendar в features/calendar
   - Интегрирован Calendar в planner page
   - Обновлена документация

   ## Тип изменений

   - [ ] Bug fix
   - [x] New feature
   - [ ] Refactoring
   - [ ] Documentation

   ## Checklist

   - [x] Код следует FSD архитектуре
   - [x] Type checking проходит (`pnpm check`)
   - [x] Linting проходит (`pnpm lint`)
   - [x] Build успешный (`pnpm build`)
   - [x] Документация обновлена (если нужно)

   ## Screenshots (если применимо)

   <img src="...">
   ```

3. **Reviewers**: Назначьте reviewers
4. **Labels**: Добавьте соответствующие labels

### Ответ на review

1. Внесите изменения согласно комментариям
2. Запушьте изменения в ту же ветку
3. Ответьте на комментарии в PR
4. Re-request review после исправлений

### Merge PR

После одобрения PR:

1. **Squash and merge** (рекомендуется) - для чистой истории
2. Удалите ветку после merge

## Code Review

### Для автора PR

- Убедитесь что все проверки прошли
- Самостоятельно просмотрите изменения перед созданием PR
- Разбивайте большие PR на меньшие (до 500 строк)
- Добавляйте комментарии к сложным местам

### Для reviewer

Проверяйте:

1. **Архитектура**

   - Соблюдение FSD правил
   - Правильная иерархия слоёв
   - Public API exports через `index.ts`

2. **Code Quality**

   - TypeScript типизация
   - Svelte 5 best practices
   - Нет дублирования кода
   - Понятные имена переменных/функций

3. **Styling**

   - Использование TailwindCSS utilities
   - Консистентность с существующим UI
   - Responsive design

4. **Performance**
   - Нет лишних re-renders
   - Правильное использование `$derived` и `$effect`

## Naming Conventions

### Files & Folders

```
kebab-case.svelte    # Компоненты
kebab-case.ts        # TypeScript files
index.ts             # Public API exports
```

**Примеры:**

```
features/
  calendar/
    ui/
      calendar.svelte          ✅
      calendar-selector.svelte ✅
    index.ts                   ✅
```

### TypeScript

```typescript
// PascalCase для types/interfaces
interface User {
	name: string;
}

type NavBarItem = {
	title: string;
	href: string;
};

// camelCase для переменных, функций
const userName = "John";
function getUserName() {}

// PascalCase для компонентов (при импорте)
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/features/calendar";
```

### Svelte Components

```svelte
<script lang="ts">
	// Props - camelCase
	let { userName, isActive } = $props();

	// State - camelCase
	let count = $state(0);

	// Derived - camelCase
	let doubled = $derived(count * 2);

	// Functions - camelCase
	function handleClick() {}
</script>
```

### CSS Classes

```svelte
<!-- TailwindCSS utilities -->
<div class="flex flex-col gap-4 rounded-lg bg-background p-4">
	<!-- ... -->
</div>

<!-- Custom classes (если нужны) - kebab-case -->
<style>
	.custom-wrapper {
		/* ... */
	}
</style>
```

## Testing

### Type Checking

```bash
# Одноразовая проверка
pnpm check

# Continuous checking
pnpm check:watch
```

### Linting

```bash
# Проверка форматирования и lint правил
pnpm lint

# Автоматическое исправление
pnpm format
```

### Manual Testing

1. Запустите `pnpm dev`
2. Проверьте функциональность в браузере
3. Проверьте responsive design (mobile, tablet, desktop)
4. Проверьте dark/light mode (если применимо)

### Build Test

```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

## Полезные команды

```bash
# Development
pnpm dev                # Start dev server
pnpm dev --host         # Expose to network

# Quality checks
pnpm check              # Type checking
pnpm check:watch        # Type checking (watch mode)
pnpm lint               # Lint check
pnpm format             # Format code

# Production
pnpm build              # Build for production
pnpm preview            # Preview production build
```

## IDE Setup

### Рекомендуемые расширения (VS Code)

- **Svelte for VS Code** - Svelte language support
- **Tailwind CSS IntelliSense** - TailwindCSS autocomplete
- **Prettier** - Code formatting
- **ESLint** - Linting

### Settings

```json
{
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "esbenp.prettier-vscode",
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true
	}
}
```

## Получить помощь

- **Архитектура**: см. [architecture guide](./architecture.md)
- **Стилистика**: см. [style guide](./style-guide.md)
- **Компоненты**: см. [components guide](./components.md)
- **Issues**: создайте issue на GitHub

## Ресурсы

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Svelte 5 Documentation](https://svelte.dev/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)