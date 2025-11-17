/**
 * Unified pointer event utilities for handling both mouse and touch events
 */

export type PointerPosition = {
  x: number;
  y: number;
};

/**
 * Extract coordinates from mouse or touch event
 */
export function getPointerPosition(event: MouseEvent | TouchEvent): PointerPosition {
  if ("touches" in event && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }
  if ("clientX" in event) {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  }
  return { x: 0, y: 0 };
}

/**
 * Check if event is a touch event
 */
export function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return "touches" in event;
}

/**
 * Prevent default behavior and stop propagation
 * Useful for preventing scroll during drag on touch devices
 */
export function preventEventDefaults(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}
