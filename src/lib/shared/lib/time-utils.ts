/**
 * Time manipulation utilities
 * Generic helpers for working with time strings (HH:mm format)
 */

/**
 * Convert time string to minutes since midnight
 * @param time - Time string in "HH:mm" format (e.g., "14:30")
 * @returns Minutes since midnight (e.g., 870 for "14:30")
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param minutes - Minutes since midnight (e.g., 870)
 * @returns Time string in "HH:mm" format (e.g., "14:30")
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Round time to nearest interval
 * @param time - Time string in "HH:mm" format
 * @param intervalMinutes - Interval to round to (default: 15)
 * @returns Rounded time string in "HH:mm" format
 * @example
 * roundTimeToInterval("14:37", 15) // "14:30"
 * roundTimeToInterval("14:38", 15) // "14:45"
 */
export function roundTimeToInterval(time: string, intervalMinutes: number = 15): string {
  const minutes = timeToMinutes(time);
  const rounded = Math.round(minutes / intervalMinutes) * intervalMinutes;
  return minutesToTime(rounded);
}

/**
 * Generate time slots for a day
 * @param intervalMinutes - Interval between slots in minutes (default: 30)
 * @returns Array of time slots with metadata
 */
export function generateTimeSlots(intervalMinutes: number = 30) {
  const slots: Array<{ time: string; isHourStart: boolean }> = [];
  const totalMinutes = 24 * 60;

  for (let minutes = 0; minutes < totalMinutes; minutes += intervalMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const time = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    slots.push({ time, isHourStart: mins === 0 });
  }

  return slots;
}
