# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

C3PO is a SvelteKit application built with TypeScript, using Svelte 5's new reactive paradigms (`$state`, `$props`, `$derived`, `$effect`). The project follows Feature-Sliced Design (FSD) architecture and uses TailwindCSS for styling with shadcn-svelte components.

## Development Commands

### Core Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm check` - Run type checking with svelte-check
- `pnpm check:watch` - Run type checking in watch mode
- `pnpm lint` - Run prettier and eslint checks
- `pnpm format` - Format all files with prettier

### Package Manager
This project uses `pnpm` as the package manager (version 10.19.0+). Always use `pnpm` commands, not `npm` or `yarn`.

## Architecture: Feature-Sliced Design (FSD)

The codebase follows Feature-Sliced Design methodology with strict layer hierarchy. Code is organized in `src/lib/` with the following layers (from highest to lowest):

### Layer Structure
```
src/lib/
├── app/          # Application-wide assets (favicon, etc)
├── pages/        # Page-level components (home-page, planner)
├── widgets/      # Complex UI blocks composed of features/entities (nav-bar)
├── features/     # User interactions and business features (login-avatar, calendar)
├── entities/     # Business entities (nav-bar routes configuration)
└── shared/       # Reusable UI components, utilities, types, config
    ├── ui/       # shadcn-svelte UI components
    ├── types/    # Shared TypeScript types
    ├── utils.ts  # Utility functions (cn, etc)
    └── config/   # Shared configuration
```

### FSD Rules
- **Import Direction**: Lower layers can only import from layers below them, never above
  - `app` → `pages` → `widgets` → `features` → `entities` → `shared`
  - Example: `widgets` can import from `features`, `entities`, and `shared`, but NOT from `pages` or `app`
- **Public API**: Each module exports through `index.ts` files
- **Cross-imports**: Features and entities should not import from each other at the same layer

### Path Aliases
- `@/*` maps to `src/lib/*`
- Import examples:
  - `@/shared/ui/button` - shared UI components
  - `@/features/calendar` - feature modules
  - `@/widgets/nav-bar` - widget modules
  - `@/entities/nav-bar` - entity data/logic

## Svelte 5 Patterns

This project uses Svelte 5's new reactive primitives:

### Reactive State
- `$state()` - Create reactive state
- `$derived()` / `$derived.by()` - Computed values
- `$effect()` / `$effect.pre()` - Side effects
- `$props()` - Component props with destructuring
- `$bindable()` - Two-way binding for props

### Component Patterns
- Use `{#snippet}` for reusable template fragments
- Props are defined with `let { propName } = $props()`
- Bindable props use `let { value = $bindable() } = $props()`
- Page state from SvelteKit: `import { page } from '$app/state'`

## Styling

### TailwindCSS Configuration
- Uses Tailwind v4 with Vite plugin
- Custom utilities via `tw-animate-css`
- Forms and typography plugins enabled
- Base styles in `src/app.css`

### Code Style (Prettier)
- Tabs for indentation
- Single quotes
- No trailing commas
- 100 character line width
- Plugins: prettier-plugin-svelte, prettier-plugin-tailwindcss

### UI Components
- Based on shadcn-svelte (bits-ui under the hood)
- Components located in `src/lib/shared/ui/`
- Uses `clsx` and `tailwind-merge` via `cn()` utility for class composition
- Dark mode support via `mode-watcher`

## Key Patterns

### Navigation
- Routes defined in `src/lib/entities/nav-bar/routes.ts` as `NavBarItem[]`
- Navigation bar (`NavBar` widget) receives items and manages active state
- Page title binding through `pageTitle` prop synchronized with layout

### Icons
- Uses `@lucide/svelte` for icons
- Icon type defined in `src/lib/shared/types/icon.ts`
- Icons imported from `@lucide/svelte/icons/*`

### Date Handling
- Uses `@internationalized/date` library
- `DateValue` type for date values
- `getLocalTimeZone()` and `today()` for current date/timezone

### Routing
- SvelteKit file-based routing in `src/routes/`
- `+page.svelte` for pages
- `+layout.svelte` for shared layouts
- Active route detection via `page.url.pathname`

## ESLint Configuration

- Based on recommended configs: `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte`
- Includes Feature-Sliced Design linting rules (`@feature-sliced/eslint-config`)
- `no-undef` disabled for TypeScript files (as recommended by typescript-eslint)
- Project uses `.gitignore` patterns for ignore rules

## TypeScript

- Strict mode enabled
- Module resolution: `bundler`
- Extends generated `.svelte-kit/tsconfig.json`
- Path aliases handled by SvelteKit configuration