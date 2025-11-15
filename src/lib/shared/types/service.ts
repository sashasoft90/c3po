/**
 * Types of beauty services offered in the salon
 */
export enum ServiceType {
  MANICURE = "manicure",
  PEDICURE = "pedicure",
  EYELASH_EXTENSION = "eyelash_extension",
}

/**
 * Service metadata including display names and default durations
 */
export interface ServiceConfig {
  type: ServiceType;
  displayName: string;
  defaultDurationMinutes: number;
  color: string; // Tailwind color class for visual coding
}

/**
 * Default configurations for each service type
 */
export const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  [ServiceType.MANICURE]: {
    type: ServiceType.MANICURE,
    displayName: "Маникюр",
    defaultDurationMinutes: 60,
    color: "bg-pink-500",
  },
  [ServiceType.PEDICURE]: {
    type: ServiceType.PEDICURE,
    displayName: "Педикюр",
    defaultDurationMinutes: 90,
    color: "bg-purple-500",
  },
  [ServiceType.EYELASH_EXTENSION]: {
    type: ServiceType.EYELASH_EXTENSION,
    displayName: "Наращивание ресниц",
    defaultDurationMinutes: 120,
    color: "bg-blue-500",
  },
};

/**
 * Get service configuration by type
 */
export function getServiceConfig(type: ServiceType): ServiceConfig {
  return SERVICE_CONFIGS[type];
}
