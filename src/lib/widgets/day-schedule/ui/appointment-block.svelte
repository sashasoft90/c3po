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

  // Calculate preview end time during resize
  const previewEndTime = $derived.by(() => {
    if (isResizing && currentResizeHeight > 0) {
      const resizeDuration = Math.round((currentResizeHeight / slotHeightPx) * slotIntervalMinutes);
      const roundedDuration = Math.round(resizeDuration / 15) * 15;
      const totalMinutes = startMinutes + roundedDuration;
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    }
    return endTime;
  });

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
  let currentResizeHeight = $state(0); // For visual feedback during resize

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
    currentResizeHeight = heightPx;

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  }

  function handleResizeMove(event: MouseEvent) {
    if (!isResizing) return;

    const deltaY = event.clientY - resizeStartY;
    const deltaMinutes = Math.round((deltaY / slotHeightPx) * slotIntervalMinutes);
    const newDuration = Math.max(slotIntervalMinutes, resizeStartDuration + deltaMinutes);

    // Round to 15 minute intervals
    const roundedDuration = Math.round(newDuration / 15) * 15;
    const newHeight = (roundedDuration / slotIntervalMinutes) * slotHeightPx;

    // Update visual height immediately
    currentResizeHeight = newHeight;
  }

  async function handleResizeEnd() {
    if (!isResizing) return;

    isResizing = false;
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);

    // Calculate final duration from current height
    const newDurationMinutes = Math.round(
      (currentResizeHeight / slotHeightPx) * slotIntervalMinutes
    );
    const roundedDuration = Math.round(newDurationMinutes / 15) * 15;

    // Reset visual height
    currentResizeHeight = 0;

    // Only save if duration actually changed
    if (roundedDuration !== durationMinutes) {
      // Optimistic update - update store immediately
      const { appointmentStore } = await import("@/entities/appointment");
      appointmentStore.update(appointment.id, {
        durationMinutes: roundedDuration,
      });

      // Then sync with API in background
      const { updateAppointment } = await import("@/shared/api/appointments");
      await updateAppointment(appointment.id, {
        durationMinutes: roundedDuration,
      });
    }
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
  style:height="{isResizing && currentResizeHeight > 0 ? currentResizeHeight : heightPx}px"
  style:min-height="48px"
  style:pointer-events="auto"
  role="button"
  tabindex="0"
>
  <div class="flex h-full flex-col justify-center gap-0.5">
    <div class="truncate text-sm leading-tight font-semibold">{serviceConfig.displayName}</div>
    <div class="truncate text-xs leading-tight text-white/90">{clientNames}</div>
    <div class="text-[10px] leading-tight text-white/70">
      {appointment.startTime} - {previewEndTime}
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
