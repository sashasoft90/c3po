import type { Icon } from "./icon";
import type { Appointment, AppointmentCreate, AppointmentUpdate, Client } from "./appointment";
import type { ServiceConfig } from "./service";

export type { Icon, Appointment, AppointmentCreate, AppointmentUpdate, Client, ServiceConfig };
export { ServiceType, SERVICE_CONFIGS, getServiceConfig } from "./service";
export { getAppointmentEndTime } from "./appointment";

// Re-export time utilities from shared/lib for convenience
export { timeToMinutes, minutesToTime, roundTimeToInterval } from "@/shared/lib";
