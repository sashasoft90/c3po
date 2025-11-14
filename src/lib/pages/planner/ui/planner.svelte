<script lang="ts">
  import { type DateValue, getLocalTimeZone, today, parseDate } from "@internationalized/date";
  import { CalendarNavigation } from "@/widgets/calendar-navigation";
  import { DaySchedule } from "@/widgets/day-schedule";

  // Cache timezone for performance
  const tz = getLocalTimeZone();
  const STORAGE_KEY = "calendar-navigation-date";
  const isBrowser = typeof window !== "undefined";

  // Shared selected date state - start with today as default (for SSR)
  let selectedDate = $state<DateValue | undefined>(today(tz));
  let initialized = $state(false);

  // Load from localStorage before first render (client-side only)
  $effect.pre(() => {
    if (isBrowser && !initialized) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          selectedDate = parseDate(saved);
        } catch {
          // If parsing fails, keep today
        }
      }
      initialized = true;
    }
  });

  // Save date to localStorage whenever it changes
  $effect(() => {
    if (isBrowser && selectedDate && initialized) {
      localStorage.setItem(STORAGE_KEY, selectedDate.toString());
    }
  });
</script>

<div class="flex h-full flex-col gap-2">
  <div class="flex shrink-0 flex-row">
    <CalendarNavigation bind:value={selectedDate} {initialized} />
  </div>

  <DaySchedule bind:selectedDate {initialized} class="min-h-0 flex-1" />
</div>
