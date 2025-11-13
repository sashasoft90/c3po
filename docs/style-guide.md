# style guide

Руководство по стилю кода проекта C3PO.

## Содержание

- [Prettier конфигурация](#prettier-конфигурация)
- [ESLint правила](#eslint-правила)
- [TypeScript Style](#typescript-style)
- [Svelte Style](#svelte-style)
- [TailwindCSS Style](#tailwindcss-style)
- [Naming Conventions](#naming-conventions)
- [Import Order](#import-order)
- [Comments](#comments)

## Prettier конфигурация

Проект использует Prettier для автоматического форматирования кода.

### Основные настройки

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "singleQuote": false,
  "semi": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "endOfLine": "crlf"
}
```

### Ключевые правила

- **Отступы**: 2 spaces (не tabs)
- **Кавычки**: двойные кавычки `"text"`
- **Точка с запятой**: обязательна
- **Trailing comma**: ES5 style (в объектах/массивах)
- **Длина строки**: максимум 100 символов

### Примеры

**✅ Правильно:**

```typescript
const user = {
  name: "John",
  age: 30,
  city: "New York",
};

function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

**❌ Неправильно:**

```typescript
// Single quotes - неправильно
const user = {
  name: "John",
  age: 30,
  city: "New York", // No trailing comma
};

// No semicolon - неправильно
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## ESLint правила

### Основная конфигурация

```javascript
// Используются рекомендованные configs:
- @eslint/js
- typescript-eslint
- eslint-plugin-svelte
- eslint-config-prettier
```

### Ключевые правила

- `no-undef: off` - отключено для TypeScript файлов (рекомендация typescript-eslint)
- Prettier конфликты разрешены через `eslint-config-prettier`

### Автоматическое исправление

```bash
# Проверка
pnpm lint

# Автоматическое исправление
pnpm format
```

## TypeScript Style

### Типизация

**Всегда явно указывайте типы для:**

- Параметров функций
- Возвращаемых значений функций
- Props компонентов
- Сложных объектов

**✅ Правильно:**

```typescript
// Функции
function calculateTotal(items: Item[], tax: number): number {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + tax);
}

// Интерфейсы
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

// Type aliases
type NavBarItem = {
  title: string;
  href: string;
  icon?: Component;
  active?: boolean;
};

// Props в Svelte компонентах
interface Props {
  userName: string;
  isActive?: boolean;
}

let { userName, isActive = false }: Props = $props();
```

**❌ Неправильно:**

```typescript
// Нет типов параметров
function calculateTotal(items, tax) {
  return items.reduce((sum, item) => sum + item.price, 0) * (1 + tax);
}

// Нет типа для props
let { userName, isActive } = $props();
```

### Naming Conventions

```typescript
// PascalCase для types/interfaces/classes
interface User {}
type NavBarItem = {};
class UserService {}

// camelCase для переменных/функций/методов
const userName = "John";
const isActive = true;
function getUserData() {}

// UPPER_SNAKE_CASE для констант
const API_BASE_URL = "https://api.example.com";
const MAX_RETRY_COUNT = 3;
```

## Svelte Style

### Component Structure

Порядок блоков в `.svelte` файле:

```svelte
<script lang="ts">
  // 1. Imports
  import { Button } from "@/shared/ui/button";
  import type { User } from "@/shared/types";

  // 2. Props
  interface Props {
    user: User;
    isEditable?: boolean;
  }
  let { user, isEditable = false }: Props = $props();

  // 3. State
  let count = $state(0);
  let items = $state<Item[]>([]);

  // 4. Derived values
  let doubled = $derived(count * 2);

  // 5. Effects
  $effect(() => {
    console.log("Count changed:", count);
  });

  // 6. Functions
  function handleClick() {
    count++;
  }
</script>

<!-- 7. Template -->
<div>
  <!-- markup -->
</div>

<!-- 8. Styles (если есть) -->
<style>
  .custom-class {
    /* styles */
  }
</style>
```

### Svelte 5 Runes

**`$state` - Reactive state:**

```svelte
<script lang="ts">
  let count = $state(0);
  let user = $state<User | null>(null);
  let items = $state<Item[]>([]);
</script>
```

**`$derived` - Computed values:**

```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  // Сложная логика с $derived.by()
  let greeting = $derived.by(() => {
    if (user) return `Hello, ${user.name}`;
    return "Hello, Guest";
  });
</script>
```

**`$effect` - Side effects:**

```svelte
<script lang="ts">
  let value = $state<DateValue>();

  // Pre-effect - до DOM update
  $effect.pre(() => {
    if (!value) value = today(getLocalTimeZone());
  });

  // Effect - после DOM update
  $effect(() => {
    console.log("Value changed:", value);
  });
</script>
```

**`$props` - Component props:**

```svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
  }

  let { title, count = 0 }: Props = $props();

  // Bindable props
  let { value = $bindable() } = $props();
</script>
```

### Conditional Rendering

```svelte
<!-- Используйте {#if} для условного рендеринга -->
{#if isLoggedIn}
  <UserDashboard />
{:else}
  <LoginForm />
{/if}

<!-- Используйте && в template для простых условий -->
<div>
  {isAdmin && <AdminPanel />}
</div>
```

### Lists

```svelte
<!-- Всегда используйте key для списков -->
{#each items as item (item.id)}
  <ListItem {item} />
{/each}

<!-- С индексом -->
{#each items as item, i (item.id)}
  <ListItem {item} index={i} />
{/each}
```

## TailwindCSS Style

### Utility Classes Order

Порядок utility classes (автоматически сортируется prettier-plugin-tailwindcss):

```svelte
<div
  class="
    flex flex-row items-center justify-between gap-4
    rounded-lg border border-border
    bg-background p-4
    text-foreground
    hover:bg-accent
  "
>
  <!-- content -->
</div>
```

**Порядок категорий:**

1. Layout (flex, grid, block, etc.)
2. Spacing (gap, p-, m-, etc.)
3. Sizing (w-, h-, etc.)
4. Typography (text-, font-, etc.)
5. Visual (bg-, border-, etc.)
6. Effects (shadow-, opacity-, etc.)
7. Transitions (transition-, etc.)
8. States (hover:, focus:, etc.)

### Color System

Используйте CSS переменные из `src/app.css`:

```svelte
<!-- ✅ Правильно - используйте semantic colors -->
<div class="bg-background text-foreground">
  <button class="bg-primary text-primary-foreground">Click</button>
  <div class="bg-muted text-muted-foreground">Muted content</div>
</div>

<!-- ❌ Неправильно - не используйте прямые цвета -->
<div class="bg-white text-black">
  <button class="bg-blue-500 text-white">Click</button>
</div>
```

### Class Composition

Используйте утилиту `cn()` для динамического объединения классов:

```svelte
<script lang="ts">
  import { cn } from "@/shared/utils";

  let { class: className, variant = "default" } = $props();

  const baseClasses = "px-4 py-2 rounded-lg";
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
  };
</script>

<button class={cn(baseClasses, variantClasses[variant], className)}>
  <slot />
</button>
```

### Responsive Design

```svelte
<!-- Mobile-first подход -->
<div class="flex flex-col gap-2 md:flex-row md:gap-4 lg:gap-6">
  <!-- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px) -->
</div>
```

### Dark Mode

```svelte
<!-- Используйте dark: префикс -->
<div class="bg-white text-black dark:bg-black dark:text-white">
  <!-- Автоматически переключается через mode-watcher -->
</div>
```

## Naming Conventions

### Files & Folders

```
kebab-case.svelte     # Svelte компоненты
kebab-case.ts         # TypeScript files
index.ts              # Public API exports
```

**Примеры:**

```
✅ calendar.svelte
✅ calendar-selector.svelte
✅ user-profile.ts
✅ use-local-storage.svelte.ts

❌ Calendar.svelte
❌ calendarSelector.svelte
❌ UserProfile.ts
```

### Variables & Functions

```typescript
// camelCase для переменных
const userName = "John";
const isActive = true;

// camelCase для функций
function getUserData() {}
function handleClick() {}

// Booleans начинаются с is/has/should
const isVisible = true;
const hasPermission = false;
const shouldRender = true;

// Event handlers начинаются с handle
function handleClick() {}
function handleSubmit() {}
function handleChange() {}
```

### Types & Interfaces

```typescript
// PascalCase для types/interfaces
interface User {}
type NavBarItem = {};

// Props интерфейсы называются Props
interface Props {
  title: string;
}
```

### CSS Classes

```css
/* kebab-case для custom CSS классов */
.nav-bar-item {
}

.user-profile-card {
}

/* Но предпочтение отдаём TailwindCSS utilities */
```

## Import Order

Порядок imports:

```typescript
// 1. External libraries
import { getLocalTimeZone, today } from "@internationalized/date";
import HouseIcon from "@lucide/svelte/icons/house";

// 2. SvelteKit imports
import { page } from "$app/state";

// 3. Internal - по слоям FSD (сверху вниз)
import { Calendar } from "@/features/calendar";
import { LoginAvatar } from "@/features/login-avatar";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utils";

// 4. Types (опционально, можно мешать с обычными imports)
import type { DateValue } from "@internationalized/date";
import type { NavBarItem } from "@/shared/types";
```

## Comments

### Когда использовать комментарии

**Пишите комментарии для:**

- Сложной бизнес-логики
- Неочевидных решений или workarounds
- Публичных API функций
- TODO/FIXME заметок

**Не пишите комментарии для:**

- Очевидного кода
- Дублирования имён переменных/функций
- Устаревшего закомментированного кода (удаляйте его)

### Примеры

**✅ Хорошие комментарии:**

```typescript
// FIXME: Temporary workaround for Windows date picker bug
// Remove when @internationalized/date v3.5.0 is released
function formatDateForWindows(date: DateValue): string {
  // ...
}

/**
 * Calculates total price including tax and discounts
 * @param items - Array of cart items
 * @param taxRate - Tax rate (0-1)
 * @returns Total price with tax
 */
function calculateTotal(items: Item[], taxRate: number): number {
  // ...
}
```

**❌ Плохие комментарии:**

```typescript
// Get user name
const userName = user.name;

// This function adds two numbers
function add(a: number, b: number): number {
  return a + b;
}

// // Old code
// function oldCalculateTotal() {
//   // ...
// }
```

## Code Quality Checklist

Перед коммитом проверьте:

- [ ] `pnpm check` - type checking проходит
- [ ] `pnpm lint` - linting проходит
- [ ] `pnpm format` - код отформатирован
- [ ] Нет закомментированного кода
- [ ] Все переменные/функции имеют понятные имена
- [ ] Сложная логика прокомментирована
- [ ] Следование FSD архитектуре
- [ ] Используются Svelte 5 runes (не старые patterns)

## IDE Configuration

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.tabSize": 2,
  "editor.insertSpaces": true
}
```

### Рекомендуемые расширения

- **Svelte for VS Code** - Svelte support
- **Tailwind CSS IntelliSense** - TailwindCSS autocomplete
- **Prettier** - Code formatting
- **ESLint** - Linting
- **Error Lens** - Inline error display

## Ресурсы

- [Prettier Documentation](https://prettier.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [TailwindCSS Best Practices](https://tailwindcss.com/docs/reusing-styles)
- [Svelte 5 Style Guide](https://svelte.dev/docs/svelte/overview)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
