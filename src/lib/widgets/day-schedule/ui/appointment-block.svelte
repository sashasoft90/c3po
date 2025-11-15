<script lang="ts">
  import type { Appointment } from "@/shared/types";
  import {
    getServiceConfig,
    getAppointmentEndTime,
    timeToMinutes,
    type ServiceConfig,
  } from "@/shared/types";
  import { cn } from "@/shared/utils";

  let {
    appointment,
    slotHeightPx,
    slotIntervalMinutes,
    onDragStart,
    onDragEnd,
    class: className = "",
  } = $props<{
    appointment: Appointment;
    slotHeightPx: number;
    slotIntervalMinutes: number;
    onDragStart?: (appointmentId: string) => void;
    onDragEnd?: () => void;
    class?: string;
  }>();

  // Get service configuration for styling
  const serviceConfig = $derived<ServiceConfig>(getServiceConfig(appointment.serviceType));

  // Calculate position and height based on time
  const startMinutes = $derived(timeToMinutes(appointment.startTime));
  const endTime = $derived(getAppointmentEndTime(appointment));
  const endMinutes = $derived(timeToMinutes(endTime));
  const durationMinutes = $derived(endMinutes - startMinutes);

  // Calculate CSS position (top) and height
  // Each slot is slotHeightPx tall and represents slotIntervalMinutes
  const topPx = $derived((startMinutes / slotIntervalMinutes) * slotHeightPx);
  const heightPx = $derived((durationMinutes / slotIntervalMinutes) * slotHeightPx);

  // Format client names
  const clientNames = $derived(appointment.clients.map((c) => c.name).join(", "));

  // Drag state
  let isDragging = $state(false);
  let isResizing = $state(false);
  let resizeStartY = $state(0);
  let resizeStartDuration = $state(0);

  function handleDragStart(event: DragEvent) {
    if (isResizing) {
      event.preventDefault();
      return;
    }
    isDragging = true;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify({ appointmentId: appointment.id })
      );
    }
    onDragStart?.(appointment.id);
  }

  function handleDragEnd() {
    isDragging = false;
    onDragEnd?.();
  }

  function handleResizeStart(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    isResizing = true;
    resizeStartY = event.clientY;
    resizeStartDuration = durationMinutes;

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  }

  async function handleResizeMove(event: MouseEvent) {
    if (!isResizing) return;

    const deltaY = event.clientY - resizeStartY;
    const deltaMinutes = Math.round((deltaY / slotHeightPx) * slotIntervalMinutes);
    const newDuration = Math.max(slotIntervalMinutes, resizeStartDuration + deltaMinutes);

    // Update appointment duration via API
    const { updateAppointment } = await import("@/shared/api/appointments");
    await updateAppointment(appointment.id, {
      durationMinutes: newDuration,
    });

    // Trigger parent refresh
    onDragEnd?.();
  }

  function handleResizeEnd() {
    isResizing = false;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }
</script>

<div
  draggable="true"
  ondragstart={handleDragStart}
  ondragend={handleDragEnd}
  class={cn(
    "group absolute right-0 left-0 z-10 overflow-hidden rounded border-2 border-l-4 px-2 py-1 shadow-md transition-all hover:shadow-lg",
    serviceConfig.color,
    "border-opacity-50 bg-opacity-90 border-l-white/80 text-white",
    isDragging && "scale-95 opacity-50",
    isResizing && "cursor-ns-resize",
    !isResizing && "cursor-move",
    className
  )}
  style:top="{topPx}px"
  style:height="{heightPx}px"
  style:min-height="48px"
  role="button"
  tabindex="0"
>
  <div class="flex h-full flex-col justify-center gap-0.5">
    <div class="truncate text-sm leading-tight font-semibold">{serviceConfig.displayName}</div>
    <div class="truncate text-xs leading-tight text-white/90">{clientNames}</div>
    <div class="text-[10px] leading-tight text-white/70">
      {appointment.startTime} - {endTime}
    </div>
    {#if appointment.notes && heightPx > 80}
      <div class="truncate text-[10px] leading-tight text-white/60 italic">
        {appointment.notes}
      </div>
    {/if}
  </div>

  <!-- Resize handle -->
  <div
    role="button"
    tabindex="0"
    onmousedown={handleResizeStart}
    class="absolute right-0 bottom-0 left-0 h-2 cursor-ns-resize opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
    style="background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))"
  ></div>
</div>
