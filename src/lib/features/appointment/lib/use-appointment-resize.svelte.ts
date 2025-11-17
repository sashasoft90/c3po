/**
 * Composable for handling appointment resize functionality
 *
 * @param appointmentId - The ID of the appointment being resized
 * @param getDurationMinutes - Getter for current duration of the appointment
 * @param getHeightPx - Getter for current height of the appointment block in pixels
 * @param slotHeightPx - Height of each time slot in pixels
 * @param slotIntervalMinutes - Duration of each slot in minutes
 * @param onResizeStart - Optional callback when resize starts
 * @param onResizeEnd - Optional callback when resize ends
 */

export function useAppointmentResize(
  appointmentId: string,
  getDurationMinutes: () => number,
  getHeightPx: () => number,
  slotHeightPx: number,
  slotIntervalMinutes: number,
  onResizeStart?: () => void,
  onResizeEnd?: () => void
) {
  let isResizing = $state(false);
  let resizeStartY = $state(0);
  let resizeStartDuration = $state(0);
  let currentResizeHeight = $state(0); // For visual feedback during resize

  function handleResizeStart(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    isResizing = true;
    resizeStartY = event.clientY;
    resizeStartDuration = getDurationMinutes();
    currentResizeHeight = getHeightPx();

    // Notify parent component that resize started
    onResizeStart?.();

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
    document.removeEventListener("touchmove", handleTouchResizeMove);
    document.removeEventListener("touchend", handleTouchResizeEnd);

    // Notify parent component that resize ended
    onResizeEnd?.();

    // Calculate final duration from current height
    const newDurationMinutes = Math.round(
      (currentResizeHeight / slotHeightPx) * slotIntervalMinutes
    );
    const roundedDuration = Math.round(newDurationMinutes / 15) * 15;

    // Reset visual height
    currentResizeHeight = 0;

    // Only save if duration actually changed
    if (roundedDuration !== getDurationMinutes()) {
      // Optimistic update - update store immediately
      const { appointmentStore } = await import("@/entities/appointment");
      appointmentStore.update(appointmentId, {
        durationMinutes: roundedDuration,
      });

      // Then sync with API in background
      const { updateAppointment } = await import("@/shared/api/appointments");
      await updateAppointment(appointmentId, {
        durationMinutes: roundedDuration,
      });
    }
  }

  function handleTouchResizeStart(event: TouchEvent) {
    if (event.touches.length === 0) return;

    event.stopPropagation();
    event.preventDefault();
    isResizing = true;
    resizeStartY = event.touches[0].clientY;
    resizeStartDuration = getDurationMinutes();
    currentResizeHeight = getHeightPx();

    // Notify parent component that resize started
    onResizeStart?.();

    document.addEventListener("touchmove", handleTouchResizeMove, { passive: false });
    document.addEventListener("touchend", handleTouchResizeEnd);
    document.addEventListener("touchcancel", handleTouchResizeEnd);
  }

  function handleTouchResizeMove(event: TouchEvent) {
    if (!isResizing || event.touches.length === 0) return;

    event.preventDefault(); // Prevent scrolling during resize

    const deltaY = event.touches[0].clientY - resizeStartY;
    const deltaMinutes = Math.round((deltaY / slotHeightPx) * slotIntervalMinutes);
    const newDuration = Math.max(slotIntervalMinutes, resizeStartDuration + deltaMinutes);

    // Round to 15 minute intervals
    const roundedDuration = Math.round(newDuration / 15) * 15;
    const newHeight = (roundedDuration / slotIntervalMinutes) * slotHeightPx;

    // Update visual height immediately
    currentResizeHeight = newHeight;
  }

  async function handleTouchResizeEnd() {
    if (!isResizing) return;

    isResizing = false;
    document.removeEventListener("touchmove", handleTouchResizeMove);
    document.removeEventListener("touchend", handleTouchResizeEnd);
    document.removeEventListener("touchcancel", handleTouchResizeEnd);

    // Notify parent component that resize ended
    onResizeEnd?.();

    // Calculate final duration from current height
    const newDurationMinutes = Math.round(
      (currentResizeHeight / slotHeightPx) * slotIntervalMinutes
    );
    const roundedDuration = Math.round(newDurationMinutes / 15) * 15;

    // Reset visual height
    currentResizeHeight = 0;

    // Only save if duration actually changed
    if (roundedDuration !== getDurationMinutes()) {
      // Optimistic update - update store immediately
      const { appointmentStore } = await import("@/entities/appointment");
      appointmentStore.update(appointmentId, {
        durationMinutes: roundedDuration,
      });

      // Then sync with API in background
      const { updateAppointment } = await import("@/shared/api/appointments");
      await updateAppointment(appointmentId, {
        durationMinutes: roundedDuration,
      });
    }
  }

  return {
    get isResizing() {
      return isResizing;
    },
    get currentResizeHeight() {
      return currentResizeHeight;
    },
    handleResizeStart,
    handleTouchResizeStart,
  };
}
