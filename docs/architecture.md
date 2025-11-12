# Architecture

Детальное описание архитектуры проекта C3PO.

## Содержание

- [Обзор](#обзор)
- [Feature-Sliced Design](#feature-sliced-design)
- [Структура проекта](#структура-проекта)
- [Слои и их назначение](#слои-и-их-назначение)
- [Правила импортов](#правила-импортов)
- [Svelte 5 Patterns](#svelte-5-patterns)
- [Routing](#routing)

## Обзор

C3PO построен на архитектурной методологии **Feature-Sliced Design (FSD)**, которая помогает организовать код в масштабируемую и поддерживаемую структуру.

### Основные принципы

1. **Разделение по слоям** - код организован в слои с четкой иерархией
2. **Унидирекциональный поток зависимостей** - слои могут импортировать только из нижележащих
3. **Public API** - каждый модуль экспортирует через `index.ts`
4. **Изоляция** - минимизация связанности между модулями одного уровня

## Feature-Sliced Design

### Иерархия слоев

```
┌─────────────────────────────────┐
│         app (highest)           │  ← Инициализация приложения
├─────────────────────────────────┤
│            pages                │  ← Страницы приложения
├─────────────────────────────────┤
│           widgets               │  ← Композитные UI блоки
├─────────────────────────────────┤
│          features               │  ← Бизнес features
├─────────────────────────────────┤
│          entities               │  ← Бизнес entities
├─────────────────────────────────┤
│      shared (lowest)            │  ← Переиспользуемый код
└─────────────────────────────────┘
```

### Правило зависимостей

**Слой может импортировать только из слоев ниже:**

```typescript
// ✅ Правильно
// widgets/nav-bar → features/login-avatar
import { LoginAvatar } from '@/features/login-avatar';

// ✅ Правильно
// features/calendar → shared/ui/button
import { Button } from '@/shared/ui/button';

// ❌ Неправильно
// features/calendar → widgets/nav-bar
import { NavBar } from '@/widgets/nav-bar'; // ОШИБКА!

// ❌ Неправильно
// features/calendar → features/login-avatar
import { LoginAvatar } from '@/features/login-avatar'; // ОШИБКА!
```

## Структура проекта

```
c3po/
├── src/
│   ├── lib/                      # Весь application code
│   │   ├── app/                  # Application layer
│   │   │   └── assets/           # Глобальные assets (favicon)
│   │   │
│   │   ├── pages/                # Pages layer
│   │   │   ├── home-page/
│   │   │   │   ├── ui/
│   │   │   │   │   └── home-page.svelte
│   │   │   │   └── index.ts      # Public API
│   │   │   └── planner/
│   │   │       ├── ui/
│   │   │       │   └── planner.svelte
│   │   │       └── index.ts
│   │   │
│   │   ├── widgets/              # Widgets layer
│   │   │   └── nav-bar/
│   │   │       ├── nav-bar.svelte
│   │   │       └── index.ts
│   │   │
│   │   ├── features/             # Features layer
│   │   │   ├── calendar/
│   │   │   │   ├── ui/
│   │   │   │   │   └── calendar.svelte
│   │   │   │   └── index.ts
│   │   │   └── login-avatar/
│   │   │       ├── ui/
│   │   │       │   └── login-avatar.svelte
│   │   │       └── index.ts
│   │   │
│   │   ├── entities/             # Entities layer
│   │   │   └── nav-bar/
│   │   │       ├── routes.ts     # Конфигурация routes
│   │   │       └── index.ts
│   │   │
│   │   └── shared/               # Shared layer
│   │       ├── ui/               # UI компоненты
│   │       │   ├── button/
│   │       │   ├── calendar/
│   │       │   ├── drawer/
│   │       │   └── navigation-menu/
│   │       ├── types/            # TypeScript types
│   │       │   ├── icon.ts
│   │       │   └── index.ts
│   │       ├── config/           # Конфигурация
│   │       └── utils.ts          # Утилиты
│   │
│   └── routes/                   # SvelteKit routing
│       ├── +layout.svelte        # Root layout
│       ├── +page.svelte          # Home page (/)
│       ├── planner/
│       │   └── +page.svelte      # Planner page (/planner)
│       └── login/
│           └── +page.svelte      # Login page (/login)
│
└── static/                       # Static assets
```

## Слои и их назначение

### 1. `app/` - Application Layer

**Назначение:** Глобальная инициализация приложения, providers, global assets.

**Содержит:**
- `assets/` - favicon, logos

**Примеры использования:**
```typescript
// src/routes/+layout.svelte
import favicon from '@/app/assets/favicon.svg';
```

### 2. `pages/` - Pages Layer

**Назначение:** Композиция страниц из widgets и features.

**Правила:**
- Один page = одна бизнес-страница
- Используется в `src/routes/+page.svelte`
- Содержит UI логику конкретной страницы

**Структура:**
```
pages/
└── planner/
    ├── ui/
    │   └── planner.svelte      # UI страницы
    ├── model/                  # State (если нужен)
    └── index.ts                # export { Planner } from './ui/planner.svelte'
```

**Пример:**
```svelte
<!-- src/lib/pages/planner/ui/planner.svelte -->
<script lang="ts">
  import { Calendar } from '@/features/calendar';
  import { Button } from '@/shared/ui/button';
  // Композиция features и shared UI
</script>
```

### 3. `widgets/` - Widgets Layer

**Назначение:** Композитные UI блоки, составленные из features и entities.

**Правила:**
- Самодостаточные UI блоки
- Могут использовать features и entities
- Переиспользуемы между pages

**Пример: NavBar widget**
```svelte
<!-- src/lib/widgets/nav-bar/nav-bar.svelte -->
<script lang="ts">
  import { LoginAvatar } from '@/features/login-avatar';
  import { ModeWatcherToggle } from '@/shared/ui/mode-watcher-toggle';
  import * as NavigationMenu from '@/shared/ui/navigation-menu';
  import type { NavBarItem } from '@/shared/ui/navigation-menu';

  let { navBarItems, pageTitle = $bindable() }: Props = $props();
</script>

<NavigationMenu.Root>
  <!-- Navigation items -->
  <ModeWatcherToggle />
  <LoginAvatar />
</NavigationMenu.Root>
```

### 4. `features/` - Features Layer

**Назначение:** Бизнес-features - законченные пользовательские сценарии.

**Правила:**
- Одна feature = одна функциональность
- Features НЕ импортируют друг друга
- Используют entities и shared

**Структура:**
```
features/
└── calendar/
    ├── ui/
    │   └── calendar.svelte     # UI feature
    ├── model/                  # State/logic (если нужен)
    └── index.ts                # Public API
```

**Пример: Calendar feature**
```svelte
<!-- src/lib/features/calendar/ui/calendar.svelte -->
<script lang="ts">
  import Calendar from '@/shared/ui/calendar/calendar.svelte';
  import * as Drawer from '@/shared/ui/drawer';
  import { Button } from '@/shared/ui/button';

  let { value = $bindable() } = $props();

  // Бизнес-логика feature: drawer с calendar selector
</script>

<Drawer.Root bind:open>
  <Drawer.Trigger>
    <Button>{triggerLabel}</Button>
  </Drawer.Trigger>
  <Drawer.Content>
    <Calendar bind:value />
  </Drawer.Content>
</Drawer.Root>
```

### 5. `entities/` - Entities Layer

**Назначение:** Бизнес-сущности приложения (модели, types, конфигурация).

**Правила:**
- Описывают бизнес-логику
- Не зависят друг от друга
- Используют только shared

**Пример: Navigation routes entity**
```typescript
// src/lib/entities/nav-bar/routes.ts
import HouseIcon from '@lucide/svelte/icons/house';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import type { NavBarItem } from '@/shared/ui/navigation-menu';

const navBarItems: NavBarItem[] = [
  {
    title: 'Home',
    href: '/',
    icon: HouseIcon,
    active: true
  },
  {
    title: 'Planner',
    href: '/planner',
    icon: CalendarDays,
    active: true
  }
];

export default navBarItems;
```

### 6. `shared/` - Shared Layer

**Назначение:** Переиспользуемый код без бизнес-логики.

**Содержит:**
- `ui/` - UI компоненты (Button, Calendar, Drawer, etc.)
- `types/` - Общие TypeScript types
- `utils.ts` - Утилиты (`cn`, helpers)
- `config/` - Конфигурация

**Правила:**
- НЕ содержит бизнес-логику
- Максимально переиспользуемый
- Может использоваться любым слоем

## Правила импортов

### Public API Pattern

Каждый модуль экспортирует через `index.ts`:

```typescript
// ✅ Правильно - импорт через Public API
import { Calendar } from '@/features/calendar';
import { Button } from '@/shared/ui/button';

// ❌ Неправильно - прямой импорт файла
import Calendar from '@/features/calendar/ui/calendar.svelte';
```

### Cross-feature imports

Features **НЕ должны** импортировать друг друга:

```typescript
// ❌ Неправильно
// features/calendar → features/login-avatar
import { LoginAvatar } from '@/features/login-avatar';
```

**Решение:** Если нужны обе features - используйте их в widget или page:

```svelte
<!-- ✅ Правильно - в widget -->
<script lang="ts">
  import { Calendar } from '@/features/calendar';
  import { LoginAvatar } from '@/features/login-avatar';
</script>
```

## Svelte 5 Patterns

### Reactive State с Runes

Проект использует новые **runes** Svelte 5:

#### `$state` - Reactive state
```svelte
<script lang="ts">
  let count = $state(0);
  let user = $state<User | null>(null);
</script>
```

#### `$derived` - Computed values
```svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  // С функцией для сложной логики
  let greeting = $derived.by(() => {
    if (user) return `Hello, ${user.name}`;
    return 'Hello, Guest';
  });
</script>
```

#### `$effect` - Side effects
```svelte
<script lang="ts">
  let value = $state<DateValue>();

  // Pre-effect - запускается до DOM update
  $effect.pre(() => {
    if (!value) value = today(getLocalTimeZone());
  });

  // Effect - запускается после DOM update
  $effect(() => {
    console.log('Value changed:', value);
  });
</script>
```

#### `$props` - Component props
```svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
  }

  // Деструктуризация props
  let { title, count = 0 }: Props = $props();

  // Bindable props (two-way binding)
  let { value = $bindable() } = $props();
</script>
```

### Snippets

Используем `{#snippet}` для переиспользуемых template блоков:

```svelte
{#snippet ListItem({ title, href, icon })}
  <a {href} class="nav-item">
    <Icon component={icon} />
    <span>{title}</span>
  </a>
{/snippet}

<!-- Использование snippet -->
{#each items as item}
  {@render ListItem(item)}
{/each}
```

## Routing

### SvelteKit File-based Routing

```
src/routes/
├── +layout.svelte          → Layout для всех pages
├── +page.svelte            → / (home)
├── planner/
│   └── +page.svelte        → /planner
└── login/
    └── +page.svelte        → /login
```

### Page Composition

Route files используют page components:

```svelte
<!-- src/routes/planner/+page.svelte -->
<script lang="ts">
  import { Planner } from '@/pages/planner';
</script>

<Planner />
```

### Layout Pattern

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { NavBar } from '@/widgets/nav-bar';
  import navBarItems from '@/entities/nav-bar';

  let { children } = $props();
  let pageTitle = $state<string | undefined>();
</script>

<NavBar {navBarItems} bind:pageTitle />
<div class="content">
  {@render children?.()}
</div>
```

## Styling

### TailwindCSS

Используем utility classes:

```svelte
<div class="flex flex-row gap-2 p-4 bg-sidebar">
  <Button variant="outline" size="icon">
    <Icon class="size-6" />
  </Button>
</div>
```

### Class Composition

Утилита `cn()` для объединения классов:

```typescript
// src/lib/shared/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Использование:**
```svelte
<script lang="ts">
  import { cn } from '@/shared/utils';
  let { class: className } = $props();
</script>

<div class={cn('base-styles', isActive && 'active-styles', className)}>
  ...
</div>
```

## Полезные ссылки

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Svelte 5 Documentation](https://svelte.dev/)
- [SvelteKit Routing](https://kit.svelte.dev/docs/routing)