# components guide

Документация переиспользуемых UI компонентов проекта C3PO.

## Содержание

- [Обзор](#обзор)
- [Базовые компоненты](#базовые-компоненты)
  - [Button](#button)
  - [Label](#label)
  - [Avatar](#avatar)
- [Композитные компоненты](#композитные-компоненты)
  - [Navigation Menu](#navigation-menu)
  - [Calendar](#calendar)
  - [Drawer](#drawer)
- [Утилиты](#утилиты)
  - [Mode Watcher](#mode-watcher)
- [Features](#features)
  - [Calendar Feature](#calendar-feature)
  - [Login Avatar](#login-avatar)

## Обзор

Все UI компоненты находятся в `src/lib/shared/ui/` и построены на основе **shadcn-svelte** (bits-ui).

### Паттерны использования

**Namespace imports** для композитных компонентов:

```svelte
<script lang="ts">
  import * as Drawer from "@/shared/ui/drawer";
  import * as NavigationMenu from "@/shared/ui/navigation-menu";
</script>

<Drawer.Root>
  <Drawer.Trigger>Open</Drawer.Trigger>
  <Drawer.Content>Content here</Drawer.Content>
</Drawer.Root>
```

**Direct imports** для простых компонентов:

```svelte
<script lang="ts">
  import { Button } from "@/shared/ui/button";
  import { Label } from "@/shared/ui/label";
</script>

<Button>Click me</Button>
```

## Базовые компоненты

### Button

Универсальная кнопка с множеством вариантов стилизации.

**Props:**

```typescript
interface ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  href?: string; // Если указан, рендерится как <a>
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  class?: string;
}
```

**Variants:**

- `default` - primary кнопка (синий фон)
- `destructive` - для опасных действий (красный)
- `outline` - с обводкой
- `secondary` - вторичная кнопка (серый)
- `ghost` - без фона
- `link` - как ссылка

**Sizes:**

- `default` - стандартный размер (h-9)
- `sm` - маленькая (h-8)
- `lg` - большая (h-10)
- `icon` - квадратная для иконки (size-9)
- `icon-sm` - маленькая иконка (size-8)
- `icon-lg` - большая иконка (size-10)

**Примеры:**

```svelte
<script lang="ts">
  import { Button } from "@/shared/ui/button";
  import PlusIcon from "@lucide/svelte/icons/plus";
</script>

<!-- Обычная кнопка -->
<Button>Click me</Button>

<!-- С variant и size -->
<Button variant="outline" size="sm">Small outline</Button>

<!-- Destructive action -->
<Button variant="destructive">Delete</Button>

<!-- Кнопка с иконкой -->
<Button variant="outline">
  <PlusIcon />
  Add item
</Button>

<!-- Только иконка -->
<Button variant="ghost" size="icon">
  <PlusIcon />
</Button>

<!-- Как ссылка -->
<Button href="/about">About page</Button>

<!-- Disabled -->
<Button disabled>Can't click</Button>
```

**Расположение:** `src/lib/shared/ui/button/`

---

### Label

Текстовый label для form элементов.

**Props:**

```typescript
interface LabelProps {
  for?: string; // ID связанного input
  class?: string;
}
```

**Пример:**

```svelte
<script lang="ts">
  import { Label } from "@/shared/ui/label";
</script>

<Label for="email">Email address</Label>
<input id="email" type="email" />
```

**Расположение:** `src/lib/shared/ui/label/`

---

### Avatar

Аватар пользователя с fallback.

**Props:**

```typescript
interface AvatarProps {
  src?: string; // URL изображения
  alt?: string;
  fallback?: string; // Текст fallback (initials)
  class?: string;
}
```

**Пример:**

```svelte
<script lang="ts">
  import * as Avatar from "@/shared/ui/avatar";
</script>

<Avatar.Root>
  <Avatar.Image src="/user.jpg" alt="User" />
  <Avatar.Fallback>JD</Avatar.Fallback>
</Avatar.Root>
```

**Расположение:** `src/lib/shared/ui/avatar/`

---

## Композитные компоненты

### Navigation Menu

Навигационное меню с поддержкой dropdown и активных состояний.

**Структура:**

```
NavigationMenu.Root        # Контейнер
├── NavigationMenu.List    # Список items
│   └── NavigationMenu.Item       # Отдельный item
│       └── NavigationMenu.Link   # Ссылка внутри item
├── NavigationMenu.Trigger        # Триггер для dropdown
├── NavigationMenu.Content        # Содержимое dropdown
└── NavigationMenu.Viewport       # Viewport для контента
```

**Types:**

```typescript
interface NavBarItem {
  title: string;
  href: string;
  icon: Icon; // Lucide icon component
  active?: boolean;
}
```

**Пример использования:**

```svelte
<script lang="ts">
  import * as NavigationMenu from "@/shared/ui/navigation-menu";
  import type { NavBarItem } from "@/shared/ui/navigation-menu";
  import HouseIcon from "@lucide/svelte/icons/house";
  import { page } from "$app/state";

  const items: NavBarItem[] = [
    { title: "Home", href: "/", icon: HouseIcon },
    { title: "About", href: "/about", icon: InfoIcon },
  ];

  function isActive(href: string) {
    return page.url.pathname === href;
  }
</script>

<NavigationMenu.Root>
  <NavigationMenu.List>
    {#each items as item}
      <NavigationMenu.Item>
        <NavigationMenu.Link>
          {#snippet child()}
            <a href={item.href} class:active={isActive(item.href)}>
              <item.icon />
              {item.title}
            </a>
          {/snippet}
        </NavigationMenu.Link>
      </NavigationMenu.Item>
    {/each}
  </NavigationMenu.List>
</NavigationMenu.Root>
```

**Расположение:** `src/lib/shared/ui/navigation-menu/`

**См. также:** Пример использования в `src/lib/widgets/nav-bar/nav-bar.svelte`

---

### Calendar

Компонент календаря с поддержкой выбора даты.

**Подкомпоненты:**

```
Calendar (Root)
├── Header
├── Months
│   └── Month
│       ├── Caption
│       │   ├── Heading
│       │   ├── MonthSelect
│       │   └── YearSelect
│       ├── Nav
│       │   ├── PrevButton
│       │   └── NextButton
│       └── Grid
│           ├── GridHead
│           │   └── HeadCell
│           └── GridBody
│               └── GridRow
│                   └── Day
│                       └── Cell
```

**Props:**

```typescript
interface CalendarProps {
  type?: "single" | "multiple" | "range";
  value?: DateValue | DateValue[] | { start: DateValue; end: DateValue };
  captionLayout?: "label" | "dropdown" | "buttons";
  numberOfMonths?: number;
  disabled?: (date: DateValue) => boolean;
  class?: string;
  onValueChange?: (value: DateValue | undefined) => void;
}
```

**Пример:**

```svelte
<script lang="ts">
  import { Calendar } from "@/shared/ui/calendar";
  import { type DateValue, today, getLocalTimeZone } from "@internationalized/date";

  let value = $state<DateValue | undefined>(today(getLocalTimeZone()));
</script>

<!-- Простой календарь -->
<Calendar type="single" bind:value />

<!-- С dropdown selectors для месяца/года -->
<Calendar type="single" bind:value captionLayout="dropdown" />

<!-- Диапазон дат -->
<Calendar type="range" bind:value />

<!-- Callback при изменении -->
<Calendar
  type="single"
  bind:value
  onValueChange={(v) => {
    console.log("Selected date:", v);
  }}
/>
```

**Расположение:** `src/lib/shared/ui/calendar/`

---

### Drawer

Выдвижная панель снизу (mobile drawer).

**Структура:**

```
Drawer.Root          # Контейнер
├── Drawer.Trigger   # Кнопка открытия
├── Drawer.Portal    # Portal для рендера
│   ├── Drawer.Overlay      # Затемнение фона
│   └── Drawer.Content      # Контент drawer
│       ├── Drawer.Header   # Шапка
│       │   ├── Drawer.Title       # Заголовок
│       │   └── Drawer.Description # Описание
│       ├── [Content]       # Ваш контент
│       └── Drawer.Footer   # Подвал
│           └── Drawer.Close       # Кнопка закрытия
```

**Props:**

```typescript
// Drawer.Root
interface DrawerProps {
  open?: boolean; // Контроль открытия
  onOpenChange?: (open: boolean) => void;
}
```

**Пример:**

```svelte
<script lang="ts">
  import * as Drawer from "@/shared/ui/drawer";
  import { Button } from "@/shared/ui/button";

  let open = $state(false);
</script>

<Drawer.Root bind:open>
  <Drawer.Trigger>
    {#snippet child({ props })}
      <Button {...props}>Open drawer</Button>
    {/snippet}
  </Drawer.Trigger>

  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>Drawer title</Drawer.Title>
      <Drawer.Description>Optional description</Drawer.Description>
    </Drawer.Header>

    <div class="p-4">
      <!-- Your content here -->
      <p>Drawer content goes here</p>
    </div>

    <Drawer.Footer>
      <Drawer.Close>
        <Button variant="outline">Close</Button>
      </Drawer.Close>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>
```

**Расположение:** `src/lib/shared/ui/drawer/`

---

## Утилиты

### Mode Watcher

Управление темой (dark/light mode).

**Компоненты:**

- `ModeWatcher` - контроллер темы (добавьте в layout)
- `ModeWatcherToggle` - кнопка переключения темы

**Пример:**

```svelte
<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import { ModeWatcherToggle } from "@/shared/ui/mode-watcher-toggle";
</script>

<!-- В layout -->
<ModeWatcher />

<!-- Кнопка переключения темы -->
<ModeWatcherToggle />
```

**Расположение:** `src/lib/shared/ui/mode-watcher-toggle/`

---

## Features

### Calendar Feature

Feature для выбора даты через drawer с calendar.

**Props:**

```typescript
interface CalendarFeatureProps {
  id?: string;
  class?: string;
}
```

**Пример:**

```svelte
<script lang="ts">
  import { Calendar } from "@/features/calendar";
</script>

<Calendar id="birthday-selector" />
```

**Что включает:**

- Кнопка с текущей датой (или выбранной)
- Drawer с календарем
- Автоматическое закрытие при выборе даты
- Responsive design

**Расположение:** `src/lib/features/calendar/ui/calendar.svelte`

**См. также:** Используется в `src/lib/pages/planner/ui/planner.svelte`

---

### Login Avatar

Feature для отображения аватара пользователя с dropdown меню.

**Props:**

```typescript
interface LoginAvatarProps {
  class?: string;
}
```

**Пример:**

```svelte
<script lang="ts">
  import { LoginAvatar } from "@/features/login-avatar";
</script>

<LoginAvatar />
```

**Расположение:** `src/lib/features/login-avatar/ui/login-avatar.svelte`

---

## Общие паттерны

### Child Snippets

Многие компоненты используют child snippets для гибкости:

```svelte
<Drawer.Trigger>
  {#snippet child({ props })}
    <Button {...props}>Custom trigger</Button>
  {/snippet}
</Drawer.Trigger>

<NavigationMenu.Link>
  {#snippet child()}
    <a href="/">Custom link content</a>
  {/snippet}
</NavigationMenu.Link>
```

### Bindable Props

Компоненты поддерживают two-way binding:

```svelte
<script lang="ts">
  let open = $state(false);
  let value = $state<DateValue>();
</script>

<Drawer.Root bind:open>...</Drawer.Root>
<Calendar bind:value />
```

### Class Composition

Все компоненты поддерживают `class` prop для кастомизации:

```svelte
<Button class="custom-class">Button</Button>
<Calendar class="mx-auto [--cell-size:48px]" />
```

### Icons

Используйте Lucide icons:

```svelte
<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import TrashIcon from "@lucide/svelte/icons/trash";
</script>

<Button>
  <PlusIcon />
  Add
</Button>

<Button variant="destructive" size="icon">
  <TrashIcon />
</Button>
```

## Стилизация

### CSS Variables

Компоненты используют CSS переменные из `src/app.css`:

```css
--color-background
--color-foreground
--color-primary
--color-primary-foreground
--color-secondary
--color-muted
--color-accent
--color-destructive
--color-border
--color-ring
```

### Dark Mode

Темная тема автоматически применяется через `ModeWatcher`:

```svelte
<!-- Автоматически работает с темой -->
<Button>I adapt to theme</Button>

<!-- Или кастомная стилизация -->
<div class="bg-white text-black dark:bg-black dark:text-white">Content</div>
```

## Создание новых компонентов

### Структура

```
src/lib/shared/ui/
└── my-component/
    ├── my-component.svelte    # Основной компонент
    ├── index.ts               # Public API
    └── README.md              # Документация (опционально)
```

### Template компонента

```svelte
<script lang="ts" module>
  import { cn, type WithElementRef } from "@/shared/utils";
  import type { HTMLAttributes } from "svelte/elements";

  export type MyComponentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: "default" | "custom";
  };
</script>

<script lang="ts">
  let {
    class: className,
    variant = "default",
    ref = $bindable(null),
    children,
    ...restProps
  }: MyComponentProps = $props();
</script>

<div bind:this={ref} class={cn("base-styles", className)} {...restProps}>
  {@render children?.()}
</div>
```

### Public API (index.ts)

```typescript
import Root, { type MyComponentProps } from "./my-component.svelte";

export { Root, Root as MyComponent, type MyComponentProps, type MyComponentProps as Props };
```

## Ресурсы

- [shadcn-svelte Documentation](https://shadcn-svelte.com/)
- [bits-ui Documentation](https://bits-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [@internationalized/date](https://react-spectrum.adobe.com/internationalized/date/)

## Troubleshooting

### Компонент не импортируется

Проверьте:

1. Public API export в `index.ts`
2. Path alias `@/*` настроен в `svelte.config.js`
3. TypeScript видит типы

### Стили не применяются

Проверьте:

1. `cn()` используется для объединения классов
2. TailwindCSS классы валидные
3. CSS переменные определены в `src/app.css`

### Dark mode не работает

Проверьте:

1. `ModeWatcher` добавлен в layout
2. Используете semantic colors (bg-background, text-foreground, etc.)
