# DaySchedule Widget

A fully-featured daily schedule widget with carousel navigation, synchronized scrolling, and persistent state management.

## Features

### Core Functionality

- **📅 Multi-Day Carousel**: Navigate between days with swipe gestures (mobile) or click/drag (desktop)
- **⏰ Configurable Time Intervals**: Display time slots in 15, 30, or 60-minute increments
- **🔄 Synchronized Scrolling**: Scroll position is synchronized across all days in real-time
- **💾 Persistent State**: Date and scroll position saved to localStorage
- **🌐 Internationalization**: Automatic locale detection with customizable language support
- **📱 Responsive Design**: Optimized for both mobile and desktop experiences
- **♿ Accessibility**: Full keyboard navigation and ARIA labels

### Visual Features

- **Hour Markers**: Bold lines and larger text for hour boundaries (e.g., 10:00, 11:00)
- **Intermediate Time Labels**: Optional display of 15/30/45 minute markers
- **Skeleton Loading**: Smooth loading state with animated skeletons
- **Custom ScrollArea**: Beautiful, styled scrollbars via shadcn-svelte
- **Hover/Active States**: Visual feedback on desktop (hover) and mobile (active/touch)

## Usage

### Basic Example

```svelte
<script lang="ts">
  import { DaySchedule } from "@/widgets/day-schedule";
  import { today, getLocalTimeZone, type DateValue } from "@internationalized/date";

  let selectedDate = $state<DateValue | undefined>(today(getLocalTimeZone()));
  let initialized = $state(true);
</script>

<DaySchedule bind:selectedDate {initialized} />
```

### Advanced Example with All Options

```svelte
<script lang="ts">
  import { DaySchedule } from "@/widgets/day-schedule";
  import { today, getLocalTimeZone, type DateValue } from "@internationalized/date";

  let selectedDate = $state<DateValue | undefined>(today(getLocalTimeZone()));
  let initialized = $state(true);
</script>

<DaySchedule
  bind:selectedDate
  {initialized}
  intervalMinutes={30}
  showIntermediateLabels={false}
  locale="ru-RU"
  class="custom-schedule"
/>
```

## Props

| Prop                     | Type                                | Default        | Description                                               |
| ------------------------ | ----------------------------------- | -------------- | --------------------------------------------------------- |
| `selectedDate`           | `DateValue \| undefined` (bindable) | `undefined`    | Currently selected date in the carousel                   |
| `initialized`            | `boolean`                           | `false`        | Loading state flag - shows skeleton when `false`          |
| `intervalMinutes`        | `number`                            | `30`           | Time slot interval in minutes (15, 30, or 60)             |
| `showIntermediateLabels` | `boolean`                           | `false`        | Show time labels for non-hour slots (e.g., :15, :30, :45) |
| `locale`                 | `string`                            | Browser locale | Locale for date formatting (e.g., "en-US", "ru-RU")       |
| `class`                  | `string`                            | `""`           | Additional CSS classes                                    |

## Architecture

### Component Structure

```
DaySchedule
├── Skeleton (when !initialized)
│   ├── Header skeleton
│   └── Time slots skeleton (10 items)
└── Carousel (when initialized)
    ├── 7 Carousel Items (days: -3, -2, -1, 0, +1, +2, +3)
    │   ├── Day header (formatted with locale)
    │   └── ScrollArea
    │       └── Time slots grid
    │           ├── Time label (left, 12-char width)
    │           └── Interactive slot (right, hover/active states)
```

### State Management

#### Local State

- `savedScrollTop`: Current scroll position synchronized across all days
- `scrollViewportRefs`: Array of refs to all 7 ScrollArea viewports
- `carouselApi`: Embla Carousel API for programmatic control
- `isProgrammaticScroll`: Flag to prevent infinite scroll loops

#### Persistent State (localStorage)

- `day-schedule-scroll-position`: Last scroll position
- Loaded via `$effect.pre()` before initial render
- Saved via `$effect()` on every scroll change

### Scroll Synchronization

The widget uses a sophisticated scroll synchronization system:

1. **User scrolls** in current day → `handleScroll` fires immediately
2. **Position saved** to `savedScrollTop` state
3. **Debounced sync** (150ms) → triggers `syncAllViewports`
4. **requestAnimationFrame** → batches DOM updates for smooth rendering
5. **All viewports updated** → except current one (prevents loops)

```javascript
// Simplified flow
scroll event → handleScroll() → savedScrollTop = position
             → debounce(150ms) → rAF → update all other viewports
```

### Carousel Integration

- Uses Embla Carousel with horizontal axis
- Center index: 3 (today's date by default)
- Days array: `[-3, -2, -1, 0, +1, +2, +3]` relative to selected date
- Swipe/drag support on all devices

## Key Features Explained

### 1. Synchronized Scrolling

When you scroll in one day, all other days automatically scroll to the same position:

```
Day 1: Scrolled to 12:00 ─┐
Day 2: Not visible        ├─→ All sync to 12:00 (debounced + rAF)
Day 3: Currently viewing  ─┘
```

**Implementation:**

- Real-time position tracking
- Debounced updates (150ms) for performance
- `requestAnimationFrame` for smooth 60fps updates
- Excludes current viewport to prevent scroll loops

### 2. Persistent State

State is preserved across page reloads:

```
Page Load → localStorage check → restore position → apply to viewport
          ↓
User scrolls → update state → save to localStorage
```

**localStorage Keys:**

- `day-schedule-scroll-position`: Integer (scrollTop in pixels)

### 3. Hour Markers vs Intermediate Slots

```
10:00 ═══════ (Bold, larger text, thick top border)
              (Interactive slot, lighter border)
              (Interactive slot, lighter border)
              (Interactive slot, lighter border)
11:00 ═══════ (Bold, larger text, thick top border)
```

**Styling differences:**

- **Hour start**: `border-t-2`, `font-bold`, `text-base`
- **Intermediate**: `border-t`, `font-normal`, `text-muted-foreground`

### 4. Mobile vs Desktop UX

**Desktop:**

- Hover effects: border brightens, background appears
- Click to select time slot
- Smooth scroll with scrollbar

**Mobile:**

- Active/touch effects: stronger visual feedback
- Swipe gestures for day navigation
- Touch-optimized scrolling
- No hover states (not applicable)

## Performance Optimizations

1. **Debouncing**: 150ms delay prevents excessive updates during fast scrolling
2. **requestAnimationFrame**: Syncs updates with browser refresh (60fps)
3. **Passive Event Listeners**: `{ passive: true }` for better scroll performance
4. **Derived State**: `$derived` for automatic recalculation without manual tracking
5. **Selective Updates**: Only sync non-active viewports (prevents loops)
6. **Batched DOM Operations**: rAF batches multiple `scrollTop` assignments

## Accessibility

- **Keyboard Navigation**: Full support via ScrollArea
- **ARIA Labels**: On all interactive elements
- **Semantic HTML**: Proper heading hierarchy
- **Focus Management**: Visible focus states
- **Screen Reader Support**: Meaningful text content

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS Safari 15.4+ (dvh support), Android Chrome
- **Fallback**: Uses `100vh` for older browsers (from `100dvh`)

## Styling

### CSS Classes

The component uses Tailwind CSS with custom utilities:

- `h-screen` / `h-dvh`: Full viewport height (with mobile fallback)
- `overflow-hidden`: Prevents page scroll
- `min-h-0`: Critical for flexbox scroll containers
- `select-none`: Prevents text selection during interactions

### Customization

```svelte
<DaySchedule class="custom-class" />
```

Use `class` prop for additional styles. The component uses `cn()` utility for class merging.

## Integration Example

### With Planner Page

```svelte
<script lang="ts">
  import { DaySchedule } from "@/widgets/day-schedule";
  import { CalendarNavigation } from "@/widgets/calendar-navigation";
  import { today, getLocalTimeZone, type DateValue } from "@internationalized/date";

  let selectedDate = $state<DateValue | undefined>(today(getLocalTimeZone()));
  let initialized = $state(false);

  // Load from localStorage
  $effect.pre(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("calendar-navigation-date");
      if (saved) {
        selectedDate = parseDate(saved);
      }
      initialized = true;
    }
  });
</script>

<div class="flex h-full flex-col gap-2">
  <CalendarNavigation bind:value={selectedDate} {initialized} />
  <DaySchedule bind:selectedDate {initialized} class="min-h-0 flex-1" />
</div>
```

## Dependencies

- `@internationalized/date`: Date manipulation and formatting
- `bits-ui`: Carousel primitive component
- `@/shared/ui/carousel`: Carousel wrapper
- `@/shared/ui/scroll-area`: Custom scrollbar component
- `@/shared/ui/skeleton`: Loading skeleton component
- `@/shared/utils`: Utility functions (cn, etc.)
- `@/shared/config`: Locale configuration
- `@/shared/event-functions`: Debounce utility

## Testing

See `day-schedule.test.ts` for comprehensive test suite covering:

- Rendering and initialization
- Date selection and navigation
- Scroll synchronization
- localStorage persistence
- Locale support
- Accessibility features

## Future Enhancements

- [ ] Event creation on time slot click
- [ ] Drag-to-create time blocks
- [ ] Multi-day event support
- [ ] Color-coded event categories
- [ ] Export schedule to calendar formats
- [ ] Recurring events
- [ ] Time zone support
- [ ] Collaborative features

## License

Part of the C3PO project.
