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
    dropTargetSlot: _dropTargetSlot = null,
    isDragging = false,
    draggedAppointmentId = null,
    scrollViewportRef = $bindable<HTMLElement | null>(null),
    onSlotClick,
    onSlotMouseMove,
    onSlotMouseEnter,
    onSlotMouseLeave,
    onSlotMouseUp,
    onSlotTouchMove,
    onSlotTouchStart,
    onSlotTouchEnd,
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
    isDragging?: boolean;
    draggedAppointmentId?: string | null;
    scrollViewportRef?: HTMLElement | null;
    onSlotClick?: (day: DateValue, time: string) => void;
    onSlotMouseMove?: (day: DateValue, time: string, event: MouseEvent) => void;
    onSlotMouseEnter?: (day: DateValue, time: string, event: MouseEvent) => void;
    onSlotMouseLeave?: () => void;
    onSlotMouseUp?: (day: DateValue, time: string) => void;
    onSlotTouchMove?: (day: DateValue, time: string, event: TouchEvent) => void;
    onSlotTouchStart?: (day: DateValue, time: string, event: TouchEvent) => void;
    onSlotTouchEnd?: (day: DateValue, time: string) => void;
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
    <div class="relative">
      <!-- Time slots grid -->
      <TimeSlotGrid
        {day}
        {timeSlots}
        {showIntermediateLabels}
        {onSlotClick}
        {onSlotMouseMove}
        {onSlotMouseEnter}
        {onSlotMouseLeave}
        {onSlotMouseUp}
        {onSlotTouchMove}
        {onSlotTouchStart}
        {onSlotTouchEnd}
        {onSlotKeydown}
      />

      <!-- Appointment blocks overlay (absolute positioning) -->
      <!-- left-16 = w-12 time label (48px) + gap-2 (8px) = 56px -->
      <!-- No container div - appointments positioned absolutely relative to parent -->
      {#each appointments as appointment (appointment.id)}
        {@const layout = appointmentLayout.get(appointment.id)}
        <AppointmentBlock
          {appointment}
          {slotHeightPx}
          {slotIntervalMinutes}
          {hourlyBorderHeightPx}
          column={layout?.column ?? 0}
          totalColumns={layout?.totalColumns ?? 1}
          isDraggingOther={isDragging && draggedAppointmentId !== appointment.id}
          onDragStart={onAppointmentDragStart}
          onDragEnd={onAppointmentDragEnd}
          onResizeStart={onAppointmentResizeStart}
          onResizeEnd={onAppointmentResizeEnd}
        />
      {/each}
    </div>
  </ScrollArea>
</div>
