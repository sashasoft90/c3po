<script lang="ts">
  import type { Appointment } from "@/shared/types";
  import {
    getServiceConfig,
    getAppointmentEndTime,
    timeToMinutes,
    type ServiceConfig,
  } from "@/shared/types";
  import { calculateAppointmentPosition } from "@/entities/appointment";
  import { useAppointmentDrag, useAppointmentResize } from "@/features/appointment";
  import { cn } from "@/shared/utils";

  let {
    appointment,
    slotHeightPx,
    slotIntervalMinutes,
    hourlyBorderHeightPx = 2,
    column = 0,
    totalColumns = 1,
    onDragStart,
    onDragEnd,
    onResizeStart,
    onResizeEnd,
    class: className = "",
  } = $props<{
    appointment: Appointment;
    slotHeightPx: number;
    slotIntervalMinutes: number;
    hourlyBorderHeightPx?: number;
    column?: number;
    totalColumns?: number;
    onDragStart?: (appointmentId: string) => void;
    onDragEnd?: () => void;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
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
  const position = $derived(
    calculateAppointmentPosition(
      appointment.startTime,
      durationMinutes,
      slotHeightPx,
      slotIntervalMinutes,
      hourlyBorderHeightPx
    )
  );
  const topPx = $derived(position.topPx);
  const heightPx = $derived(position.heightPx);

  // Calculate horizontal positioning for overlapping appointments
  const widthPercent = $derived((1 / totalColumns) * 100);
  const leftPercent = $derived((column / totalColumns) * 100);

  // Format client names
  const clientNames = $derived(appointment.clients.map((c: { name: string }) => c.name).join(", "));

  // Use drag composable
  const drag = useAppointmentDrag(appointment.id, onDragStart, onDragEnd);

  // Use resize composable (pass getters to avoid capturing initial values)
  const resize = useAppointmentResize(
    appointment.id,
    () => durationMinutes,
    () => heightPx,
    slotHeightPx,
    slotIntervalMinutes,
    onResizeStart,
    onResizeEnd
  );

  // Calculate preview end time during resize
  const previewEndTime = $derived.by(() => {
    if (resize.isResizing && resize.currentResizeHeight > 0) {
      const resizeDuration = Math.round(
        (resize.currentResizeHeight / slotHeightPx) * slotIntervalMinutes
      );
      const roundedDuration = Math.round(resizeDuration / 15) * 15;
      const totalMinutes = startMinutes + roundedDuration;
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    }
    return endTime;
  });
</script>

<div
  draggable="true"
  ondragstart={drag.handleDragStart}
  ondragend={drag.handleDragEnd}
  class={cn(
    "group absolute z-10 overflow-hidden rounded border-2 border-l-4 px-2 py-1 shadow-md transition-all hover:shadow-lg",
    serviceConfig.color,
    "border-white/30 border-l-white/80 text-white",
    drag.isDragging && "scale-95 opacity-50",
    resize.isResizing && "cursor-ns-resize",
    !resize.isResizing && "cursor-move",
    className
  )}
  style:top="{topPx}px"
  style:height="{resize.isResizing && resize.currentResizeHeight > 0
    ? resize.currentResizeHeight
    : heightPx}px"
  style:left="{leftPercent}%"
  style:width="{widthPercent}%"
  style:pointer-events="auto"
  role="button"
  tabindex="0"
>
  <div class="flex h-full flex-col justify-center gap-0.5">
    <div class="truncate text-sm leading-tight font-semibold">{serviceConfig.displayName}</div>
    {#if heightPx > slotHeightPx}
      <div class="truncate text-xs leading-tight text-white/90">{clientNames}</div>
    {/if}
    {#if heightPx > slotHeightPx * 1.5}
      <div class="text-[10px] leading-tight text-white/70">
        {appointment.startTime} - {previewEndTime}
      </div>
    {/if}
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
    onmousedown={resize.handleResizeStart}
    class="absolute right-0 bottom-0 left-0 h-2 cursor-ns-resize opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100"
    style="background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))"
  ></div>
</div>
