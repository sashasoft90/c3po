<script lang="ts">
  import { type DateValue, getLocalTimeZone, today } from "@internationalized/date";
  import type { CarouselAPI } from "@/shared/ui/carousel";
  // noinspection ES6UnusedImports
  import * as Carousel from "@/shared/ui/carousel";
  import { Skeleton } from "@/shared/ui/skeleton";
  import { cn } from "@/shared/utils";
  import { defaultLocale } from "@/shared/config";
  import {
    appointmentStore,
    calculateAppointmentLayout,
    type AppointmentLayout,
  } from "@/entities/appointment";
  import { fetchAppointments } from "@/shared/api/appointments";
  import { AppointmentCreateDialog } from "@/features/appointment";
  import { useScrollSync } from "@/shared/lib/use-scroll-sync.svelte";
  import { roundTimeToInterval, getServiceConfig } from "@/shared/types";
  import DayColumn from "./day-column.svelte";

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
  const isBrowser = typeof window !== "undefined";

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

  // Scroll synchronization composable
  const scrollSync = useScrollSync(
    "day-schedule-scroll-position",
    7, // 7 days in carousel
    () => carouselApi?.selectedScrollSnap() ?? 0,
    initialized
  );

  // Disable carousel looping during drag and resize operations
  $effect(() => {
    if (!carouselApi) return;

    if (draggedAppointmentId || isResizing) {
      // Disable looping when dragging or resizing
      carouselApi.reInit({ loop: false });
    } else {
      // Re-enable looping when not dragging or resizing
      carouselApi.reInit({ loop: true });
    }
  });

  // Handle carousel API initialization
  function onCarouselApiChange(api: CarouselAPI | undefined) {
    carouselApi = api;
  }

  // When carousel position changes, update selectedDate
  $effect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      if (!carouselApi) return;
      const index = carouselApi.selectedScrollSnap();
      selectedDate = days[index];
    };

    carouselApi.on("select", handleSelect);

    return () => {
      carouselApi?.off("select", handleSelect);
    };
  });

  // When selectedDate changes externally (e.g., from calendar), update carousel position
  $effect(() => {
    if (!carouselApi || !selectedDate) return;

    // Find the index of the selected date in the days array
    const index = days.findIndex((day) => day.compare(selectedDate) === 0);

    // Only update the carousel if the index changed
    if (index !== -1 && index !== carouselApi.selectedScrollSnap()) {
      carouselApi.scrollTo(index);
    }
  });

  // Restore saved scroll position to current viewport after initialization
  $effect(() => {
    if (!carouselApi || !initialized) return;
    scrollSync.restoreScrollPosition();
  });

  // Setup scroll synchronization for the current viewport
  $effect(() => {
    if (!carouselApi) return;
    return scrollSync.setupScrollSync();
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

  // Load appointments on initialization
  $effect(() => {
    if (initialized && isBrowser) {
      fetchAppointments().then((response) => {
        if (response.data) {
          appointmentStore.setAll(response.data);
        }
      });
    }
  });

  // Get appointments for a specific day
  function getAppointmentsForDay(day: DateValue) {
    return appointmentStore.getByDate(day);
  }

  // Calculate layout for appointments on each day (handles overlaps)
  function getAppointmentLayoutForDay(day: DateValue): Map<string, AppointmentLayout> {
    const appointments = getAppointmentsForDay(day);
    return calculateAppointmentLayout(appointments);
  }

  // Calculate slot height in pixels (needed for appointment positioning)
  const SLOT_HEIGHT_PX = 32; // matches h-8 class (8 * 4px = 32px)
  const HOURLY_BORDER_HEIGHT_PX = 2; // matches border-t-2 class (2px)

  // Drag and drop state
  let draggedAppointmentId = $state<string | null>(null);
  let dropTargetSlot = $state<{ day: DateValue; time: string } | null>(null);
  let dragPreviewPosition = $state<{ x: number; y: number } | null>(null);
  const isDragging = $derived(!!draggedAppointmentId);

  // Get dragged appointment data for preview
  const draggedAppointment = $derived.by(() => {
    if (!draggedAppointmentId) return null;
    return appointmentStore.getById(draggedAppointmentId);
  });

  // Track mouse position during drag for preview
  if (isBrowser) {
    $effect(() => {
      if (!isDragging) {
        dragPreviewPosition = null;
        return;
      }

      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (draggedAppointmentId) {
          dragPreviewPosition = { x: e.clientX, y: e.clientY };
        }
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    });
  }

  // Resize state
  let isResizing = $state(false);

  function handleAppointmentDragStart(appointmentId: string) {
    draggedAppointmentId = appointmentId;
  }

  async function handleAppointmentDragEnd() {
    draggedAppointmentId = null;
    dropTargetSlot = null;
    dragPreviewPosition = null;
  }

  function handleAppointmentResizeStart() {
    isResizing = true;
  }

  function handleAppointmentResizeEnd() {
    isResizing = false;
  }

  function handleSlotMouseEnter(day: DateValue, time: string) {
    if (!draggedAppointmentId) return;

    // Round time to 15-minute intervals
    const roundedTime = roundTimeToInterval(time, 15);
    dropTargetSlot = { day, time: roundedTime };
  }

  function handleSlotMouseLeave() {
    // Don't clear dropTargetSlot on mouseleave - only clear it when drag ends
    // This prevents flickering when mouse briefly leaves slot during drag
  }

  async function handleSlotMouseUp(day: DateValue, time: string) {
    if (!draggedAppointmentId) return;

    const appointmentId = draggedAppointmentId;

    // Clear drop target
    dropTargetSlot = null;

    try {
      // Round to 15-minute intervals
      const roundedTime = roundTimeToInterval(time, 15);

      // Optimistic update - update store immediately for instant UI feedback
      appointmentStore.update(appointmentId, {
        date: day,
        startTime: roundedTime,
      });

      // Then sync with API in background
      const { updateAppointment } = await import("@/shared/api/appointments");
      await updateAppointment(appointmentId, {
        date: day,
        startTime: roundedTime,
      });
    } catch (error) {
      console.error("Failed to update appointment:", error);

      // On error, refresh from API to get correct state
      const response = await fetchAppointments();
      if (response.data) {
        appointmentStore.setAll(response.data);
      }
    }
  }

  // Appointment creation
  let createDialogOpen = $state(false);
  let createDialogDate = $state<DateValue>(today(tz));
  let createDialogTime = $state("09:00");

  function handleSlotClick(day: DateValue, time: string) {
    if (draggedAppointmentId) return; // Don't open dialog during drag

    createDialogDate = day;
    createDialogTime = time;
    createDialogOpen = true;
  }

  async function handleAppointmentCreated() {
    // Refresh appointments after creation
    const response = await fetchAppointments();
    if (response.data) {
      appointmentStore.setAll(response.data);
    }
  }

  function handleSlotKeydown(event: KeyboardEvent, day: DateValue, time: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSlotClick(day, time);
    }
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
      opts={{ startIndex: centerIndex, axis: "x", loop: true }}
    >
      <Carousel.Content class="h-full">
        {#each days as day, dayIndex (day.toString())}
          <Carousel.Item class="flex h-full">
            <DayColumn
              {day}
              dayOfWeek={formatDayOfWeek(day)}
              {timeSlots}
              appointments={getAppointmentsForDay(day)}
              appointmentLayout={getAppointmentLayoutForDay(day)}
              {showIntermediateLabels}
              slotHeightPx={SLOT_HEIGHT_PX}
              slotIntervalMinutes={intervalMinutes}
              hourlyBorderHeightPx={HOURLY_BORDER_HEIGHT_PX}
              {dropTargetSlot}
              {isDragging}
              {draggedAppointmentId}
              bind:scrollViewportRef={scrollSync.scrollViewportRefs[dayIndex]}
              onSlotClick={handleSlotClick}
              onSlotMouseEnter={handleSlotMouseEnter}
              onSlotMouseLeave={handleSlotMouseLeave}
              onSlotMouseUp={handleSlotMouseUp}
              onSlotKeydown={handleSlotKeydown}
              onAppointmentDragStart={handleAppointmentDragStart}
              onAppointmentDragEnd={handleAppointmentDragEnd}
              onAppointmentResizeStart={handleAppointmentResizeStart}
              onAppointmentResizeEnd={handleAppointmentResizeEnd}
            />
          </Carousel.Item>
        {/each}
      </Carousel.Content>
    </Carousel.Root>

    <!-- Appointment creation dialog -->
    <AppointmentCreateDialog
      bind:open={createDialogOpen}
      date={createDialogDate}
      startTime={createDialogTime}
      onCreated={handleAppointmentCreated}
    />

    <!-- Drag preview following cursor -->
    {#if isDragging && draggedAppointment && dragPreviewPosition}
      {@const serviceConfig = getServiceConfig(draggedAppointment.serviceType)}
      <div
        class={cn(
          "pointer-events-none fixed z-50 rounded border-2 border-l-4 px-2 py-1 opacity-80 shadow-lg",
          serviceConfig.color,
          "border-white/30 border-l-white/80 text-white"
        )}
        style:left="{dragPreviewPosition.x + 10}px"
        style:top="{dragPreviewPosition.y + 10}px"
        style:width="180px"
      >
        <div class="text-xs font-semibold">
          {serviceConfig.displayName}
        </div>
        <div class="text-xs opacity-90">
          {draggedAppointment.clients.map((c) => c.name).join(", ")}
        </div>
        <div class="text-xs opacity-75">
          {draggedAppointment.startTime}
        </div>
        {#if dropTargetSlot}
          <div class="mt-1 border-t border-white/30 pt-1 text-xs font-bold">
            → {dropTargetSlot.time}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
