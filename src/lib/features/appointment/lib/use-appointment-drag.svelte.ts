/**
 * Composable for handling appointment drag & drop functionality using mouse/touch events
 * (HTML5 DnD doesn't work well with ScrollArea)
 *
 * @param appointmentId - The ID of the appointment being dragged
 * @param onDragStart - Optional callback when drag starts
 * @param onDragEnd - Optional callback when drag ends
 */

const DRAG_THRESHOLD = 5; // pixels to move before starting drag

export function useAppointmentDrag(
  appointmentId: string,
  onDragStart?: (appointmentId: string) => void,
  onDragEnd?: () => void
) {
  let isDragging = $state(false);
  let startX = 0;
  let startY = 0;
  let hasMoved = false;

  function handleMouseDown(event: MouseEvent) {
    // Ignore right click
    if (event.button !== 0) return;

    startX = event.clientX;
    startY = event.clientY;
    hasMoved = false;

    // Add global listeners for mouse move and up
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent) {
    const deltaX = Math.abs(event.clientX - startX);
    const deltaY = Math.abs(event.clientY - startY);

    // Check if moved beyond threshold
    if (!hasMoved && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
      hasMoved = true;
      isDragging = true;
      onDragStart?.(appointmentId);
    }
  }

  function handleMouseUp() {
    // Clean up listeners
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    if (isDragging) {
      isDragging = false;
      onDragEnd?.();
    }
  }

  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch) return;

    startX = touch.clientX;
    startY = touch.clientY;
    hasMoved = false;

    // Add global listeners
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);
  }

  function handleTouchMove(event: TouchEvent) {
    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);

    if (!hasMoved && (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)) {
      hasMoved = true;
      isDragging = true;
      onDragStart?.(appointmentId);
    }
  }

  function handleTouchEnd() {
    // Clean up listeners
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    document.removeEventListener("touchcancel", handleTouchEnd);

    if (isDragging) {
      isDragging = false;
      onDragEnd?.();
    }
  }

  return {
    get isDragging() {
      return isDragging;
    },
    handleMouseDown,
    handleTouchStart,
  };
}
