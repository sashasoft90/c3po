<script lang="ts">
  import { type DateValue, getLocalTimeZone, today } from "@internationalized/date";
  import { Calendar } from "@/features/calendar";
  import { Button } from "@/shared/ui/button";
  import { Skeleton } from "@/shared/ui/skeleton";
  import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import { cn } from "@/shared/utils";

  let {
    value = $bindable<DateValue | undefined>(today(getLocalTimeZone())),
    initialized = false,
    class: className = "",
    id = "calendar-navigation",
  } = $props();

  // Cache timezone for performance
  const tz = getLocalTimeZone();

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
  {#if !initialized}
    <Skeleton class="h-9 w-9 shrink-0" />
    <Skeleton class="h-9 min-w-32 flex-1" />
    <Skeleton class="h-9 w-9 shrink-0" />
    <Skeleton class="h-9 w-18 shrink-0" />
  {:else}
    <Button variant="outline" size="icon" onclick={previousDay} aria-label="Previous day">
      <ChevronLeftIcon />
    </Button>

    <Calendar bind:value class="min-w-32 flex-1" {id} />

    <Button variant="outline" size="icon" onclick={nextDay} aria-label="Next day">
      <ChevronRightIcon />
    </Button>

    <Button variant="outline" onclick={resetToday} aria-label="Reset to today">Today</Button>
  {/if}
</div>
