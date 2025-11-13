<script lang="ts">
  import { type DateValue, getLocalTimeZone, today, parseDate } from "@internationalized/date";
  import { Calendar } from "@/features/calendar";
  import { Button } from "@/shared/ui/button";
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { cn } from "@/shared/utils";

  let { class: className = "", id = "calendar-navigation" } = $props();

  // Cache timezone for performance
  const tz = getLocalTimeZone();
  const STORAGE_KEY = "calendar-navigation-date";
  const isBrowser = typeof window !== "undefined";

  // Load saved date from localStorage or use today
  function loadInitialDate(): DateValue {
    if (isBrowser) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return parseDate(saved);
        } catch {
          // If parsing fails, use today
          return today(tz);
        }
      }
    }
    return today(tz);
  }

  let value = $state<DateValue | undefined>(loadInitialDate());

  // Save date to localStorage whenever it changes
  $effect(() => {
    if (isBrowser && value) {
      localStorage.setItem(STORAGE_KEY, value.toString());
    }
  });

  // Optimized functions - ensure synchronous state updates
  function previousDay() {
    // Always use current value, falling back to today
    const current = value ?? today(tz);
    value = current.subtract({ days: 1 });
  }

  function nextDay() {
    // Always use current value, falling back to today
    const current = value ?? today(tz);
    value = current.add({ days: 1 });
  }

  function resetToday() {
    value = today(tz);
  }
</script>

<div class={cn("flex flex-row items-center gap-2", className)}>
  <Button variant="outline" size="icon" onclick={previousDay} aria-label="Previous day">
    <ChevronLeftIcon />
  </Button>

  <Calendar bind:value class="flex-1" {id} />

  <Button variant="outline" size="icon" onclick={nextDay} aria-label="Next day">
    <ChevronRightIcon />
  </Button>

  <Button variant="outline" onclick={resetToday} aria-label="Reset to today">Today</Button>
</div>
