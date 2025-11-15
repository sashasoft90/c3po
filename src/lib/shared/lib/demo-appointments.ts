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
    {
      id: "demo-1",
      serviceType: ServiceType.MANICURE,
      clients: [{ id: "client-1", name: "Анна Иванова" }],
      date: currentDate,
      startTime: "10:00",
      durationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-2",
      serviceType: ServiceType.PEDICURE,
      clients: [{ id: "client-2", name: "Мария Петрова" }],
      date: currentDate,
      startTime: "12:30",
      durationMinutes: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-3",
      serviceType: ServiceType.EYELASH_EXTENSION,
      clients: [{ id: "client-3", name: "Елена Сидорова" }],
      date: currentDate,
      startTime: "15:00",
      durationMinutes: 120,
      notes: "Классическое наращивание",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-4",
      serviceType: ServiceType.MANICURE,
      clients: [
        { id: "client-4", name: "Ольга Смирнова" },
        { id: "client-5", name: "Татьяна Козлова" },
      ],
      date: currentDate.add({ days: 1 }),
      startTime: "14:00",
      durationMinutes: 75,
      notes: "Групповая запись",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "demo-5",
      serviceType: ServiceType.PEDICURE,
      clients: [{ id: "client-6", name: "Наталья Волкова" }],
      date: currentDate.add({ days: -1 }),
      startTime: "11:00",
      durationMinutes: 90,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}
