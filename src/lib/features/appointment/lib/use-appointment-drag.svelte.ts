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

    // Add global listeners with passive: false to allow preventDefault
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
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

    // Prevent scrolling during drag
    if (isDragging) {
      event.preventDefault();

      // Find element under finger and trigger its touch handler
      const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elementUnderFinger) {
        // Trigger touchmove event on the element
        // Safari-compatible approach: create event without Touch arrays
        try {
          const syntheticEvent = new TouchEvent("touchmove", {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 0,
          });
          // Store touch coordinates as custom properties for handlers to access
          Object.defineProperty(syntheticEvent, "touches", {
            value: event.touches,
            writable: false,
          });
          Object.defineProperty(syntheticEvent, "targetTouches", {
            value: event.targetTouches,
            writable: false,
          });
          Object.defineProperty(syntheticEvent, "changedTouches", {
            value: event.changedTouches,
            writable: false,
          });
          elementUnderFinger.dispatchEvent(syntheticEvent);
        } catch {
          // Fallback: directly call ontouchmove handler if exists
          const htmlElement = elementUnderFinger as HTMLElement;
          const handler = htmlElement.ontouchmove;
          if (handler) {
            handler.call(htmlElement, event);
          }
        }
      }
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    // Clean up listeners
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    document.removeEventListener("touchcancel", handleTouchEnd);

    if (isDragging) {
      // Dispatch touchend to element under finger (using last known position)
      const touch = event.changedTouches[0];
      if (touch) {
        const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementUnderFinger) {
          // Safari-compatible approach
          try {
            const syntheticEvent = new TouchEvent("touchend", {
              bubbles: true,
              cancelable: true,
              view: window,
              detail: 0,
            });
            Object.defineProperty(syntheticEvent, "touches", {
              value: event.touches,
              writable: false,
            });
            Object.defineProperty(syntheticEvent, "targetTouches", {
              value: event.targetTouches,
              writable: false,
            });
            Object.defineProperty(syntheticEvent, "changedTouches", {
              value: event.changedTouches,
              writable: false,
            });
            elementUnderFinger.dispatchEvent(syntheticEvent);
          } catch {
            // Fallback: directly call ontouchend handler if exists
            const htmlElement = elementUnderFinger as HTMLElement;
            const handler = htmlElement.ontouchend;
            if (handler) {
              handler.call(htmlElement, event);
            }
          }
        }
      }

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
