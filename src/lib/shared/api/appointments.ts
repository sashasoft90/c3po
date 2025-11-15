import type { Appointment, AppointmentCreate, AppointmentUpdate } from "@/shared/types";
import { parseDate } from "@internationalized/date";
import { generateDemoAppointments } from "@/shared/lib/demo-appointments";

const STORAGE_KEY = "c3po_appointments";
const DEMO_INITIALIZED_KEY = "c3po_demo_initialized";

/**
 * API Response type
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Serialize appointment for storage (DateValue can't be JSON stringified directly)
 */
function serializeAppointment(apt: Appointment): Record<string, unknown> {
  return {
    ...apt,
    date: {
      year: apt.date.year,
      month: apt.date.month,
      day: apt.date.day,
    },
    createdAt: apt.createdAt.toISOString(),
    updatedAt: apt.updatedAt.toISOString(),
  };
}

/**
 * Deserialize appointment from storage
 */
function deserializeAppointment(data: Record<string, unknown>): Appointment {
  return {
    ...(data as Omit<Appointment, "date" | "createdAt" | "updatedAt">),
    date: parseDate(
      `${(data.date as { year: number }).year}-${String((data.date as { month: number }).month).padStart(2, "0")}-${String((data.date as { day: number }).day).padStart(2, "0")}`
    ),
    createdAt: new Date(data.createdAt as string),
    updatedAt: new Date(data.updatedAt as string),
  };
}

/**
 * Get all appointments from localStorage
 */
function getStoredAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map(deserializeAppointment);
  } catch (error) {
    console.error("Failed to load appointments from localStorage:", error);
    return [];
  }
}

/**
 * Save appointments to localStorage
 */
function saveAppointments(appointments: Appointment[]): void {
  if (typeof window === "undefined") return;

  try {
    const serialized = appointments.map(serializeAppointment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error("Failed to save appointments to localStorage:", error);
  }
}

/**
 * Initialize demo data if storage is empty
 */
function initializeDemoData(): void {
  if (typeof window === "undefined") return;

  const demoInitialized = localStorage.getItem(DEMO_INITIALIZED_KEY);
  const existingAppointments = getStoredAppointments();

  // Only initialize demo data if not already done and no appointments exist
  if (!demoInitialized && existingAppointments.length === 0) {
    const demoAppointments = generateDemoAppointments();
    saveAppointments(demoAppointments);
    localStorage.setItem(DEMO_INITIALIZED_KEY, "true");
  }
}

/**
 * Fetch all appointments
 * TODO: Replace with real API call
 */
export async function fetchAppointments(): Promise<ApiResponse<Appointment[]>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    // Initialize demo data on first run
    initializeDemoData();

    const appointments = getStoredAppointments();
    return { data: appointments };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to fetch appointments" };
  }
}

/**
 * Create a new appointment
 * TODO: Replace with real API call
 */
export async function createAppointment(
  data: AppointmentCreate
): Promise<ApiResponse<Appointment>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    const appointment: Appointment = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const appointments = getStoredAppointments();
    appointments.push(appointment);
    saveAppointments(appointments);

    return { data: appointment };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create appointment" };
  }
}

/**
 * Update an existing appointment
 * TODO: Replace with real API call
 */
export async function updateAppointment(
  id: string,
  updates: AppointmentUpdate
): Promise<ApiResponse<Appointment>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    const appointments = getStoredAppointments();
    const index = appointments.findIndex((apt) => apt.id === id);

    if (index === -1) {
      return { error: "Appointment not found" };
    }

    appointments[index] = {
      ...appointments[index],
      ...updates,
      updatedAt: new Date(),
    };

    saveAppointments(appointments);
    return { data: appointments[index] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update appointment" };
  }
}

/**
 * Delete an appointment
 * TODO: Replace with real API call
 */
export async function deleteAppointment(id: string): Promise<ApiResponse<void>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    const appointments = getStoredAppointments();
    const filtered = appointments.filter((apt) => apt.id !== id);

    if (filtered.length === appointments.length) {
      return { error: "Appointment not found" };
    }

    saveAppointments(filtered);
    return { data: undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to delete appointment" };
  }
}
