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

/**
 * Layout information for overlapping appointments
 */
export interface AppointmentLayout {
  appointmentId: string;
  column: number;
  totalColumns: number;
}

/**
 * Calculate column layout for overlapping appointments
 * Returns layout information for each appointment
 */
export function calculateAppointmentLayout(appointments: Appointment[]): Map<string, AppointmentLayout> {
  const layout = new Map<string, AppointmentLayout>();

  if (appointments.length === 0) return layout;

  // Sort appointments by start time
  const sorted = [...appointments].sort((a, b) => {
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });

  // Group overlapping appointments together
  const groups: Appointment[][] = [];

  for (const apt of sorted) {
    // Find a group where this appointment overlaps with at least one appointment
    let foundGroup = false;

    for (const group of groups) {
      const overlapsWithGroup = group.some(existing => appointmentsOverlap(apt, existing));
      if (overlapsWithGroup) {
        group.push(apt);
        foundGroup = true;
        break;
      }
    }

    if (!foundGroup) {
      groups.push([apt]);
    }
  }

  // For each group, assign columns
  for (const group of groups) {
    if (group.length === 1) {
      // No overlap - full width
      layout.set(group[0].id, {
        appointmentId: group[0].id,
        column: 0,
        totalColumns: 1
      });
    } else {
      // Multiple overlapping appointments - assign columns
      // Sort by start time within the group
      const sortedGroup = [...group].sort((a, b) =>
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );

      // Assign columns using a greedy algorithm
      const columns: Appointment[][] = [];

      for (const apt of sortedGroup) {
        // Find the first column where this appointment doesn't overlap
        let assignedColumn = -1;

        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
          const columnAppointments = columns[colIndex];
          const overlapsInColumn = columnAppointments.some(existing =>
            appointmentsOverlap(apt, existing)
          );

          if (!overlapsInColumn) {
            columnAppointments.push(apt);
            assignedColumn = colIndex;
            break;
          }
        }

        // If no suitable column found, create a new one
        if (assignedColumn === -1) {
          columns.push([apt]);
          assignedColumn = columns.length - 1;
        }

        layout.set(apt.id, {
          appointmentId: apt.id,
          column: assignedColumn,
          totalColumns: 0 // Will be updated after all assignments
        });
      }

      // Update totalColumns for all appointments in this group
      const totalColumns = columns.length;
      for (const apt of group) {
        const layoutInfo = layout.get(apt.id);
        if (layoutInfo) {
          layoutInfo.totalColumns = totalColumns;
        }
      }
    }
  }

  return layout;
}
