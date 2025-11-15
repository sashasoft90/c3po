import type { DateValue } from "@internationalized/date";
import type { Appointment } from "@/shared/types";

/**
 * Svelte 5 store for managing appointments
 * Uses $state rune for reactivity
 */
class AppointmentStore {
  appointments = $state<Appointment[]>([]);

  /**
   * Get appointments for a specific date
   */
  getByDate(date: DateValue): Appointment[] {
    return this.appointments.filter(
      (apt) =>
        apt.date.year === date.year && apt.date.month === date.month && apt.date.day === date.day
    );
  }

  /**
   * Get appointments within a date range
   */
  getByDateRange(startDate: DateValue, endDate: DateValue): Appointment[] {
    return this.appointments.filter((apt) => {
      const aptTime = new Date(apt.date.year, apt.date.month - 1, apt.date.day).getTime();
      const startTime = new Date(startDate.year, startDate.month - 1, startDate.day).getTime();
      const endTime = new Date(endDate.year, endDate.month - 1, endDate.day).getTime();
      return aptTime >= startTime && aptTime <= endTime;
    });
  }

  /**
   * Add a new appointment
   */
  add(appointment: Appointment): void {
    this.appointments.push(appointment);
  }

  /**
   * Update an existing appointment
   */
  update(id: string, updates: Partial<Appointment>): void {
    const index = this.appointments.findIndex((apt) => apt.id === id);
    if (index !== -1) {
      this.appointments[index] = {
        ...this.appointments[index],
        ...updates,
        updatedAt: new Date(),
      };
    }
  }

  /**
   * Delete an appointment
   */
  delete(id: string): void {
    this.appointments = this.appointments.filter((apt) => apt.id !== id);
  }

  /**
   * Set all appointments (e.g., from API fetch)
   */
  setAll(appointments: Appointment[]): void {
    this.appointments = appointments;
  }

  /**
   * Clear all appointments
   */
  clear(): void {
    this.appointments = [];
  }
}

/**
 * Global appointment store instance
 */
export const appointmentStore = new AppointmentStore();
