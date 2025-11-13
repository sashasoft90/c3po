<script lang="ts">
  import { type DateValue, getLocalTimeZone, today } from "@internationalized/date";
  import type { CarouselAPI } from "@/shared/ui/carousel";
  import * as Carousel from "@/shared/ui/carousel";
  import { Skeleton } from "@/shared/ui/skeleton";
  import { cn } from "@/shared/utils";

  let {
    selectedDate = $bindable<DateValue | undefined>(),
    initialized = false,
    intervalMinutes = 15,
    class: className = "",
  } = $props();

  // Cache timezone
  const tz = getLocalTimeZone();

  // Generate days around selected date (for carousel navigation)
  const daysRange = 3; // Show 3 days before and after
  const days = $derived.by(() => {
    const current = selectedDate ?? today(tz);
    const result: DateValue[] = [];

    for (let i = -daysRange; i <= daysRange; i++) {
      result.push(current.add({ days: i }));
    }

    return result;
  });

  // Calculate initial carousel index (center)
  const centerIndex = daysRange;

  // Carousel API for syncing
  let carouselApi = $state<CarouselAPI | undefined>();

  // Track if we're programmatically scrolling (to avoid loops)
  let isProgrammaticScroll = $state(false);

  // Handle carousel API initialization
  function onCarouselApiChange(api: CarouselAPI | undefined) {
    carouselApi = api;
  }

  // When carousel position changes, update selectedDate
  $effect(() => {
    if (!carouselApi || isProgrammaticScroll) return;

    const handleSelect = () => {
      if (!carouselApi || isProgrammaticScroll) return;
      const index = carouselApi.selectedScrollSnap();
      selectedDate = days[index];
    };

    carouselApi.on("select", handleSelect);

    return () => {
      carouselApi?.off("select", handleSelect);
    };
  });

  // When selectedDate changes externally, update carousel position
  $effect(() => {
    if (!carouselApi || !selectedDate) return;

    // Find the index of the selected date
    const index = days.findIndex((day) => day.compare(selectedDate) === 0);

    if (index !== -1 && index !== carouselApi.selectedScrollSnap()) {
      isProgrammaticScroll = true;
      carouselApi.scrollTo(index);
      setTimeout(() => {
        isProgrammaticScroll = false;
      }, 100);
    }
  });

  // Generate time slots for the day
  const timeSlots = $derived.by(() => {
    const slots: string[] = [];
    const totalMinutes = 24 * 60;

    for (let minutes = 0; minutes < totalMinutes; minutes += intervalMinutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
    }

    return slots;
  });

  // Format day info
  function formatDayOfWeek(date: DateValue): string {
    return date.toDate(tz).toLocaleDateString("ru-RU", { weekday: "long" });
  }

  function formatDate(date: DateValue): string {
    return date.toDate(tz).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
    });
  }
</script>

<div class={cn("flex flex-col gap-4", className)}>
  {#if !initialized}
    <!-- Skeleton для виджета DaySchedule -->
    <div class="flex flex-col gap-4">
      <!-- Header skeleton -->
      <div class="flex flex-col items-center gap-1">
        <Skeleton class="h-8 w-40" />
        <Skeleton class="h-4 w-32" />
      </div>

      <!-- Time slots skeleton -->
      <div class="flex flex-col gap-1">
        {#each Array(10) as _, i}
          <div class="flex items-center gap-2 border-b border-border py-2">
            <Skeleton class="h-4 w-16" />
            <Skeleton class="h-12 flex-1" />
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Day carousel (swipe left/right to change days) -->
    <Carousel.Root
      class="w-full"
      setApi={onCarouselApiChange}
      opts={{ startIndex: centerIndex, axis: "x" }}
    >
      <Carousel.Content>
        {#each days as day}
          <Carousel.Item>
            <div class="flex flex-col gap-4">
              <!-- Header with day of week -->
              <div class="flex flex-col items-center gap-1">
                <h2 class="text-2xl font-semibold capitalize">{formatDayOfWeek(day)}</h2>
                <p class="text-sm text-muted-foreground">{formatDate(day)}</p>
              </div>

              <!-- Vertical scrollable time schedule -->
              <div class="flex flex-col gap-1 overflow-y-auto" style="height: calc(100vh - 250px);">
                {#each timeSlots as timeSlot}
                  <div class="flex items-center gap-2 border-b border-border py-2">
                    <span class="w-16 text-sm font-medium">{timeSlot}</span>
                    <div class="h-12 flex-1 rounded border border-dashed border-border/50"></div>
                  </div>
                {/each}
              </div>
            </div>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
    </Carousel.Root>
  {/if}
</div>
