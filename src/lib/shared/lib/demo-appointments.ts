import { today, getLocalTimeZone } from "@internationalized/date";
import type { Appointment } from "@/shared/types";
import { ServiceType } from "@/shared/types";

/**
 * Generate demo appointments for testing
 */
export function generateDemoAppointments(): Appointment[] {
  const tz = getLocalTimeZone();
  const currentDate = today(tz);

  return [
    // Non-overlapping appointments
    {
      id: "demo-1",
      serviceType: ServiceType.MANICURE,
      clients: [{ id: "client-1", name: "Анна Иванова" }],
      date: currentDate,
      startTime: "09:00",
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Overlapping appointments - should be side by side
    {
      id: "demo-2",
      serviceType: ServiceType.PEDICURE,
      clients: [{ id: "client-2", name: "Мария Петрова" }],
      date: currentDate,
      startTime: "10:30",
      durationMinutes: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-3",
      serviceType: ServiceType.MANICURE,
      clients: [{ id: "client-3", name: "Елена Сидорова" }],
      date: currentDate,
      startTime: "11:00",
      durationMinutes: 60,
      notes: "Перекрывается с demo-2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Three overlapping appointments at once
    {
      id: "demo-4",
      serviceType: ServiceType.EYELASH_EXTENSION,
      clients: [{ id: "client-4", name: "Ольга Смирнова" }],
      date: currentDate,
      startTime: "14:00",
      durationMinutes: 120,
      notes: "Наращивание",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-5",
      serviceType: ServiceType.MANICURE,
      clients: [{ id: "client-5", name: "Татьяна Козлова" }],
      date: currentDate,
      startTime: "14:30",
      durationMinutes: 60,
      notes: "Перекрывается с demo-4",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-6",
      serviceType: ServiceType.PEDICURE,
      clients: [{ id: "client-6", name: "Наталья Волкова" }],
      date: currentDate,
      startTime: "15:00",
      durationMinutes: 90,
      notes: "Перекрывается с demo-4 и demo-5",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Previous day appointment
    {
      id: "demo-7",
      serviceType: ServiceType.PEDICURE,
      clients: [{ id: "client-7", name: "Светлана Морозова" }],
      date: currentDate.add({ days: -1 }),
      startTime: "11:00",
      durationMinutes: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}
