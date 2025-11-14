<script lang="ts">
  import { type DateValue, getLocalTimeZone, today } from "@internationalized/date";
  import type { CarouselAPI } from "@/shared/ui/carousel";
  // noinspection ES6UnusedImports
  import * as Carousel from "@/shared/ui/carousel";
  import { Skeleton } from "@/shared/ui/skeleton";
  import { ScrollArea } from "@/shared/ui/scroll-area";
  import { cn } from "@/shared/utils";
  import { defaultLocale } from "@/shared/config";

  let {
    selectedDate = $bindable<DateValue | undefined>(),
    initialized = false,
    intervalMinutes = 30,
    showIntermediateLabels = false,
    locale = defaultLocale,
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
    const slots: Array<{ time: string; isHourStart: boolean }> = [];
    const totalMinutes = 24 * 60;

    for (let minutes = 0; minutes < totalMinutes; minutes += intervalMinutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const time = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      slots.push({ time, isHourStart: mins === 0 });
    }

    return slots;
  });

  // Format day info
  function formatDayOfWeek(date: DateValue): string {
    return date.toDate(tz).toLocaleDateString(locale, { weekday: "long" });
  }
</script>

<div class={cn("flex h-full flex-col gap-2 select-none", className)}>
  {#if !initialized}
    <!-- Skeleton для виджета DaySchedule -->
    <div class="flex flex-col gap-4">
      <!-- Header skeleton -->
      <div class="flex flex-col items-center gap-1">
        <Skeleton class="h-8 w-40" />
      </div>

      <!-- Time slots skeleton -->
      <div class="flex flex-col gap-1">
        {#each Array(10) as _, i (i)}
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
      class="h-full w-full"
      setApi={onCarouselApiChange}
      opts={{ startIndex: centerIndex, axis: "x" }}
    >
      <Carousel.Content class="h-full">
        {#each days as day (day.toString())}
          <Carousel.Item class="flex h-full">
            <div class="flex flex-1 shrink-0 flex-col gap-2 overflow-hidden">
              <!-- Header with day of week -->
              <div class="flex shrink-0 flex-col items-center gap-0">
                <h2 class="text-2xl font-semibold capitalize">{formatDayOfWeek(day)}</h2>
              </div>
              <!-- Vertical scrollable time schedule -->
              <ScrollArea class="min-h-0 flex-1">
                {#snippet children()}
                  <div class="flex flex-col gap-0">
                    {#each timeSlots as { time, isHourStart } (time)}
                      <div
                        class={cn(
                          "flex items-center gap-2",
                          isHourStart ? "border-t-2 border-t-border" : ""
                        )}
                      >
                        {#if isHourStart || showIntermediateLabels}
                          <span
                            class={cn(
                              "w-12 text-sm",
                              isHourStart
                                ? "text-base font-bold"
                                : "font-normal text-muted-foreground"
                            )}
                          >
                            {time}
                          </span>
                        {:else}
                          <span class="w-12"></span>
                        {/if}
                        <div
                          class={cn(
                            "h-8 flex-1 cursor-pointer rounded border-x border-dashed border-border/100 transition-colors",
                            "hover:border-border/50 hover:bg-accent/20",
                            "active:border-border/50 active:bg-accent/30",
                            !isHourStart ? "border-t border-t-border/100" : ""
                          )}
                        ></div>
                      </div>
                    {/each}
                  </div>
                {/snippet}
              </ScrollArea>
            </div>
          </Carousel.Item>
        {/each}
      </Carousel.Content>
    </Carousel.Root>
  {/if}
</div>
