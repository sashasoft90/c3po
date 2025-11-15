import type { Appointment } from "@/shared/types";
import { timeToMinutes, getAppointmentEndTime } from "@/shared/types";

/**
 * Check if two appointments overlap
 */
export function appointmentsOverlap(apt1: Appointment, apt2: Appointment): boolean {
  // Different dates don't overlap
  if (
    apt1.date.year !== apt2.date.year ||
    apt1.date.month !== apt2.date.month ||
    apt1.date.day !== apt2.date.day
  ) {
    return false;
  }

  const apt1Start = timeToMinutes(apt1.startTime);
  const apt1End = timeToMinutes(getAppointmentEndTime(apt1));
  const apt2Start = timeToMinutes(apt2.startTime);
  const apt2End = timeToMinutes(getAppointmentEndTime(apt2));

  return apt1Start < apt2End && apt2Start < apt1End;
}

/**
 * Validate appointment time is within business hours
 */
export function isWithinBusinessHours(
  startTime: string,
  durationMinutes: number,
  businessStart: string = "09:00",
  businessEnd: string = "21:00"
): boolean {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  const businessStartMinutes = timeToMinutes(businessStart);
  const businessEndMinutes = timeToMinutes(businessEnd);

  return startMinutes >= businessStartMinutes && endMinutes <= businessEndMinutes;
}

/**
 * Check if appointment conflicts with existing appointments
 */
export function hasConflicts(
  appointment: Appointment,
  existingAppointments: Appointment[]
): boolean {
  return existingAppointments.some(
    (existing) => existing.id !== appointment.id && appointmentsOverlap(appointment, existing)
  );
}
