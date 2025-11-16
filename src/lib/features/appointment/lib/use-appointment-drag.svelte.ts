/**
 * Composable for handling appointment drag & drop functionality
 *
 * @param appointmentId - The ID of the appointment being dragged
 * @param onDragStart - Optional callback when drag starts
 * @param onDragEnd - Optional callback when drag ends
 */

export function useAppointmentDrag(
  appointmentId: string,
  onDragStart?: (appointmentId: string) => void,
  onDragEnd?: () => void
) {
  let isDragging = $state(false);

  function handleDragStart(event: DragEvent) {
    isDragging = true;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/json", JSON.stringify({ appointmentId }));
    }
    onDragStart?.(appointmentId);
  }

  function handleDragEnd() {
    isDragging = false;
    onDragEnd?.();
  }

  return {
    get isDragging() {
      return isDragging;
    },
    handleDragStart,
    handleDragEnd,
  };
}
