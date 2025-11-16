import type { DateValue } from "@internationalized/date";
import type { ServiceType } from "./service";

/**
 * Client information for an appointment
 */
export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

/**
 * Appointment/booking for a beauty service
 */
export interface Appointment {
  id: string;
  serviceType: ServiceType;
  clients: Client[]; // Support for 1-to-many (one master, multiple clients)
  date: DateValue;
  startTime: string; // Format: "HH:mm" (e.g., "14:30")
  durationMinutes: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Appointment creation data (without auto-generated fields)
 */
export type AppointmentCreate = Omit<Appointment, "id" | "createdAt" | "updatedAt">;

/**
 * Appointment update data (partial updates allowed)
 */
export type AppointmentUpdate = Partial<Omit<Appointment, "id" | "createdAt" | "updatedAt">>;

/**
 * Calculate end time for an appointment
 * This is appointment-specific business logic, so it stays here
 */
export function getAppointmentEndTime(appointment: Appointment): string {
  const [hours, minutes] = appointment.startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + appointment.durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}
