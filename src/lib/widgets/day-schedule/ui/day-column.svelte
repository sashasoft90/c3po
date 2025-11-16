<script lang="ts">
  import type { DateValue } from "@internationalized/date";
  import { ScrollArea } from "@/shared/ui/scroll-area";
  import { TimeSlotGrid } from "@/shared/ui/time-slot-grid";
  import { cn } from "@/shared/utils";
  import type { Appointment } from "@/shared/types";
  import type { AppointmentLayout } from "@/entities/appointment";
  import AppointmentBlock from "./appointment-block.svelte";

  let {
    day,
    dayOfWeek,
    timeSlots,
    appointments,
    appointmentLayout,
    showIntermediateLabels = false,
    slotHeightPx,
    slotIntervalMinutes,
    hourlyBorderHeightPx,
    dropTargetSlot = null,
    scrollViewportRef = $bindable<HTMLElement | null>(null),
    onSlotClick,
    onSlotDragOver,
    onSlotDragLeave,
    onSlotDrop,
    onSlotMouseDown,
    onSlotMouseUp,
    onSlotKeydown,
    onAppointmentDragStart,
    onAppointmentDragEnd,
    onAppointmentResizeStart,
    onAppointmentResizeEnd,
    class: className = "",
  } = $props<{
    day: DateValue;
    dayOfWeek: string;
    timeSlots: Array<{ time: string; isHourStart: boolean }>;
    appointments: Appointment[];
    appointmentLayout: Map<string, AppointmentLayout>;
    showIntermediateLabels?: boolean;
    slotHeightPx: number;
    slotIntervalMinutes: number;
    hourlyBorderHeightPx: number;
    dropTargetSlot?: { day: DateValue; time: string } | null;
    scrollViewportRef?: HTMLElement | null;
    onSlotClick?: (day: DateValue, time: string) => void;
    onSlotDragOver?: (event: DragEvent, day: DateValue, time: string) => void;
    onSlotDragLeave?: () => void;
    onSlotDrop?: (event: DragEvent, day: DateValue, time: string) => void;
    onSlotMouseDown?: (day: DateValue, time: string) => void;
    onSlotMouseUp?: () => void;
    onSlotKeydown?: (event: KeyboardEvent, day: DateValue, time: string) => void;
    onAppointmentDragStart?: (appointmentId: string) => void;
    onAppointmentDragEnd?: () => void;
    onAppointmentResizeStart?: () => void;
    onAppointmentResizeEnd?: () => void;
    class?: string;
  }>();
</script>

<div class={cn("flex flex-1 shrink-0 flex-col gap-2 overflow-hidden", className)}>
  <!-- Header with day of week -->
  <div class="flex shrink-0 flex-col items-center gap-0">
    <h2 class="text-2xl font-semibold capitalize">{dayOfWeek}</h2>
  </div>

  <!-- Vertical scrollable time schedule -->
  <ScrollArea class="min-h-0 flex-1" bind:viewportRef={scrollViewportRef}>
    {#snippet children()}
      <div class="relative">
        <!-- Time slots grid -->
        <TimeSlotGrid
          {day}
          {timeSlots}
          {showIntermediateLabels}
          {dropTargetSlot}
          {onSlotClick}
          {onSlotDragOver}
          {onSlotDragLeave}
          {onSlotDrop}
          {onSlotMouseDown}
          {onSlotMouseUp}
          {onSlotKeydown}
        />

        <!-- Appointment blocks overlay (absolute positioning) -->
        <!-- left-16 = w-12 time label (48px) + gap-2 (8px) = 56px -->
        <div
          class="absolute top-0 right-2 left-16"
          style="height: {timeSlots.length * slotHeightPx}px; pointer-events: none;"
        >
          {#each appointments as appointment (appointment.id)}
            {@const layout = appointmentLayout.get(appointment.id)}
            <AppointmentBlock
              {appointment}
              {slotHeightPx}
              {slotIntervalMinutes}
              {hourlyBorderHeightPx}
              column={layout?.column ?? 0}
              totalColumns={layout?.totalColumns ?? 1}
              onDragStart={onAppointmentDragStart}
              onDragEnd={onAppointmentDragEnd}
              onResizeStart={onAppointmentResizeStart}
              onResizeEnd={onAppointmentResizeEnd}
            />
          {/each}
        </div>
      </div>
    {/snippet}
  </ScrollArea>
</div>
