/**
 * Tests for appointment validation and layout functions
 *
 * This test suite covers:
 * - appointmentsOverlap: Detecting time conflicts between appointments
 * - isWithinBusinessHours: Validating appointments fit within business hours
 * - hasConflicts: Checking if an appointment conflicts with existing ones
 * - calculateAppointmentLayout: Computing column layout for overlapping appointments
 * - calculateAppointmentPosition: Calculating precise pixel positions accounting for borders
 *
 * Run tests: pnpm test validators.test.ts
 */
import { describe, it, expect } from "vitest";
import { today, getLocalTimeZone } from "@internationalized/date";
import {
  appointmentsOverlap,
  isWithinBusinessHours,
  hasConflicts,
  calculateAppointmentLayout,
  calculateAppointmentPosition,
} from "./validators";
import type { Appointment } from "@/shared/types";
import { ServiceType } from "@/shared/types";

describe("Appointment Validators", () => {
  const tz = getLocalTimeZone();
  const testDate = today(tz);

  // Helper function to create test appointments
  const createAppointment = (
    id: string,
    startTime: string,
    durationMinutes: number,
    serviceType: ServiceType = ServiceType.MANICURE
  ): Appointment => ({
    id,
    serviceType,
    clients: [{ id: "client-1", name: "Test Client" }],
    date: testDate,
    startTime,
    durationMinutes,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe("appointmentsOverlap", () => {
    it("should detect overlapping appointments", () => {
      const apt1 = createAppointment("1", "10:00", 60); // 10:00 - 11:00
      const apt2 = createAppointment("2", "10:30", 60); // 10:30 - 11:30

      expect(appointmentsOverlap(apt1, apt2)).toBe(true);
    });

    it("should not detect overlap when appointments are sequential", () => {
      const apt1 = createAppointment("1", "10:00", 60); // 10:00 - 11:00
      const apt2 = createAppointment("2", "11:00", 60); // 11:00 - 12:00

      expect(appointmentsOverlap(apt1, apt2)).toBe(false);
    });

    it("should not detect overlap when appointments have gap", () => {
      const apt1 = createAppointment("1", "10:00", 60); // 10:00 - 11:00
      const apt2 = createAppointment("2", "12:00", 60); // 12:00 - 13:00

      expect(appointmentsOverlap(apt1, apt2)).toBe(false);
    });

    it("should detect overlap when one appointment contains another", () => {
      const apt1 = createAppointment("1", "10:00", 120); // 10:00 - 12:00
      const apt2 = createAppointment("2", "10:30", 30); // 10:30 - 11:00

      expect(appointmentsOverlap(apt1, apt2)).toBe(true);
    });

    it("should not detect overlap on different dates", () => {
      const apt1 = createAppointment("1", "10:00", 60);
      const apt2 = createAppointment("2", "10:30", 60);
      apt2.date = testDate.add({ days: 1 });

      expect(appointmentsOverlap(apt1, apt2)).toBe(false);
    });

    it("should detect overlap when appointments end and start at exact minute", () => {
      const apt1 = createAppointment("1", "10:00", 30); // 10:00 - 10:30
      const apt2 = createAppointment("2", "10:29", 30); // 10:29 - 10:59

      expect(appointmentsOverlap(apt1, apt2)).toBe(true);
    });
  });

  describe("isWithinBusinessHours", () => {
    it("should accept appointment within default business hours", () => {
      expect(isWithinBusinessHours("10:00", 60)).toBe(true);
    });

    it("should reject appointment starting before business hours", () => {
      expect(isWithinBusinessHours("08:00", 60)).toBe(false);
    });

    it("should reject appointment ending after business hours", () => {
      expect(isWithinBusinessHours("20:30", 60)).toBe(false);
    });

    it("should accept appointment exactly at business hours boundaries", () => {
      expect(isWithinBusinessHours("09:00", 60)).toBe(true);
      expect(isWithinBusinessHours("20:00", 60)).toBe(true);
    });

    it("should work with custom business hours", () => {
      expect(isWithinBusinessHours("08:00", 60, "08:00", "18:00")).toBe(true);
      expect(isWithinBusinessHours("07:00", 60, "08:00", "18:00")).toBe(false);
      expect(isWithinBusinessHours("17:30", 60, "08:00", "18:00")).toBe(false);
    });
  });

  describe("hasConflicts", () => {
    it("should detect conflicts with existing appointments", () => {
      const existing = [createAppointment("1", "10:00", 60), createAppointment("2", "12:00", 60)];
      const newApt = createAppointment("3", "10:30", 60);

      expect(hasConflicts(newApt, existing)).toBe(true);
    });

    it("should not detect conflicts when no overlap", () => {
      const existing = [createAppointment("1", "10:00", 60), createAppointment("2", "12:00", 60)];
      const newApt = createAppointment("3", "14:00", 60);

      expect(hasConflicts(newApt, existing)).toBe(false);
    });

    it("should ignore self when checking conflicts", () => {
      const existing = [createAppointment("1", "10:00", 60)];
      const sameApt = createAppointment("1", "10:00", 60);

      expect(hasConflicts(sameApt, existing)).toBe(false);
    });
  });

  describe("calculateAppointmentLayout", () => {
    it("should return single column for non-overlapping appointments", () => {
      const appointments = [
        createAppointment("1", "10:00", 60),
        createAppointment("2", "12:00", 60),
      ];

      const layout = calculateAppointmentLayout(appointments);

      expect(layout.get("1")).toEqual({
        appointmentId: "1",
        column: 0,
        totalColumns: 1,
      });
      expect(layout.get("2")).toEqual({
        appointmentId: "2",
        column: 0,
        totalColumns: 1,
      });
    });

    it("should split overlapping appointments into columns", () => {
      const appointments = [
        createAppointment("1", "10:00", 60), // 10:00 - 11:00
        createAppointment("2", "10:30", 60), // 10:30 - 11:30
      ];

      const layout = calculateAppointmentLayout(appointments);

      expect(layout.get("1")?.totalColumns).toBe(2);
      expect(layout.get("2")?.totalColumns).toBe(2);
      expect(layout.get("1")?.column).not.toBe(layout.get("2")?.column);
    });

    it("should handle three overlapping appointments", () => {
      const appointments = [
        createAppointment("1", "10:00", 120), // 10:00 - 12:00
        createAppointment("2", "10:30", 60), // 10:30 - 11:30
        createAppointment("3", "11:00", 60), // 11:00 - 12:00
      ];

      const layout = calculateAppointmentLayout(appointments);

      const apt1 = layout.get("1");
      const apt2 = layout.get("2");
      const apt3 = layout.get("3");

      // All three overlap at some point, so could need up to 3 columns
      // The algorithm may use 2 or 3 columns depending on implementation
      // apt1 overlaps with both apt2 and apt3
      // apt2 and apt3 can potentially share a column if they don't overlap
      expect(apt1?.totalColumns).toBeGreaterThanOrEqual(2);
      expect(apt2?.totalColumns).toBeGreaterThanOrEqual(2);
      expect(apt3?.totalColumns).toBeGreaterThanOrEqual(2);

      // All should be in same group
      expect(apt1?.totalColumns).toBe(apt2?.totalColumns);
      expect(apt2?.totalColumns).toBe(apt3?.totalColumns);

      // apt1 should be in different column from apt2 and apt3
      expect(apt1?.column).not.toBe(apt2?.column);
      expect(apt1?.column).not.toBe(apt3?.column);
    });

    it("should return empty map for empty array", () => {
      const layout = calculateAppointmentLayout([]);
      expect(layout.size).toBe(0);
    });

    it("should handle complex overlapping scenario", () => {
      const appointments = [
        createAppointment("1", "09:00", 60), // 09:00 - 10:00 (no overlap)
        createAppointment("2", "10:00", 90), // 10:00 - 11:30 (overlaps with 3)
        createAppointment("3", "10:30", 60), // 10:30 - 11:30 (overlaps with 2)
        createAppointment("4", "12:00", 60), // 12:00 - 13:00 (no overlap)
      ];

      const layout = calculateAppointmentLayout(appointments);

      // apt1 and apt4 should be full width (no overlap)
      expect(layout.get("1")?.totalColumns).toBe(1);
      expect(layout.get("4")?.totalColumns).toBe(1);

      // apt2 and apt3 should share space (2 columns)
      expect(layout.get("2")?.totalColumns).toBe(2);
      expect(layout.get("3")?.totalColumns).toBe(2);
    });
  });

  describe("calculateAppointmentPosition", () => {
    describe("Top position calculation", () => {
      it("should calculate correct top position for midnight", () => {
        const pos = calculateAppointmentPosition("00:00", 60);
        // 0 slots from midnight + 1 hour boundary (00:00) * 2px = 2px
        expect(pos.topPx).toBe(2);
      });

      it("should calculate correct top position for 01:00", () => {
        const pos = calculateAppointmentPosition("01:00", 60);
        // 2 slots from midnight (30min each) + 2 hour boundaries (00:00, 01:00) * 2px = 64 + 4 = 68
        expect(pos.topPx).toBe(68);
      });

      it("should calculate correct top position for 10:00", () => {
        const pos = calculateAppointmentPosition("10:00", 60);
        // 20 slots from midnight (30min each) + 11 hour boundaries * 2px
        // 20 * 32 + 11 * 2 = 640 + 22 = 662
        expect(pos.topPx).toBe(662);
      });

      it("should calculate correct top position for 10:30", () => {
        const pos = calculateAppointmentPosition("10:30", 60);
        // 21 slots from midnight + 11 hour boundaries * 2px
        // 21 * 32 + 11 * 2 = 672 + 22 = 694
        expect(pos.topPx).toBe(694);
      });

      it("should account for custom border height", () => {
        const pos = calculateAppointmentPosition("01:00", 60, 32, 30, 4);
        // 2 slots from midnight + 2 hour boundaries * 4px = 64 + 8 = 72
        expect(pos.topPx).toBe(72);
      });
    });

    describe("Height calculation", () => {
      it("should calculate height without internal hour boundaries", () => {
        const pos = calculateAppointmentPosition("10:00", 60); // 10:00 - 11:00
        // 2 slots * 32px + 0 internal boundaries = 64px
        expect(pos.heightPx).toBe(64);
      });

      it("should calculate height with one internal hour boundary", () => {
        const pos = calculateAppointmentPosition("10:30", 90); // 10:30 - 12:00
        // 3 slots * 32px + 1 internal boundary (11:00) * 2px = 96 + 2 = 98
        expect(pos.heightPx).toBe(98);
      });

      it("should calculate height with multiple internal hour boundaries", () => {
        const pos = calculateAppointmentPosition("10:00", 180); // 10:00 - 13:00
        // 6 slots * 32px + 2 internal boundaries (11:00, 12:00) * 2px = 192 + 4 = 196
        expect(pos.heightPx).toBe(196);
      });

      it("should not count start hour boundary as internal", () => {
        const pos = calculateAppointmentPosition("10:00", 120); // 10:00 - 12:00
        // Starts exactly on 10:00, so 10:00 is on edge, not inside
        // 4 slots * 32px + 1 internal boundary (11:00) * 2px = 128 + 2 = 130
        expect(pos.heightPx).toBe(130);
      });

      it("should not count end hour boundary as internal", () => {
        const pos = calculateAppointmentPosition("10:30", 90); // 10:30 - 12:00
        // Ends exactly on 12:00, so 12:00 is on edge, not inside
        // 3 slots * 32px + 1 internal boundary (11:00) * 2px = 96 + 2 = 98
        expect(pos.heightPx).toBe(98);
      });

      it("should handle appointment starting and ending on hour boundaries", () => {
        const pos = calculateAppointmentPosition("01:00", 60); // 01:00 - 02:00
        // Both start and end on hour, no internal boundaries
        // 2 slots * 32px + 0 internal boundaries = 64px
        expect(pos.heightPx).toBe(64);
      });

      it("should handle very long appointment (00:00 - 23:30)", () => {
        const pos = calculateAppointmentPosition("00:00", 23 * 60 + 30);
        // Duration: 23:30 = 1410 minutes = 47 slots (each 30 min)
        // Starts at 00:00 (on hour), ends at 23:30 (not on hour)
        // Internal boundaries: 01:00 through 23:00 = 23 boundaries
        // But start is on 00:00, so first internal is 01:00
        // firstHourInside = 00:00 + 60 = 01:00 (60 minutes)
        // lastHourInside = floor(23:30 / 60) * 60 = 23:00 (1380 minutes)
        // boundaries = (1380 - 60) / 60 + 1 = 22 + 1 = 23
        // 47 * 32 + 23 * 2 = 1504 + 46 = 1550
        expect(pos.heightPx).toBe(1550);
      });

      it("should account for custom slot height", () => {
        const pos = calculateAppointmentPosition("10:00", 60, 40, 30, 2);
        // 2 slots * 40px + 0 internal boundaries = 80px
        expect(pos.heightPx).toBe(80);
      });

      it("should account for custom border height", () => {
        const pos = calculateAppointmentPosition("10:00", 180, 32, 30, 4);
        // 6 slots * 32px + 2 internal boundaries * 4px = 192 + 8 = 200
        expect(pos.heightPx).toBe(200);
      });

      it("should handle 15-minute slots", () => {
        const pos = calculateAppointmentPosition("10:00", 60, 20, 15, 2);
        // 4 slots * 20px + 0 internal boundaries = 80px
        expect(pos.heightPx).toBe(80);
      });
    });

    describe("Edge cases", () => {
      it("should handle very short appointment (15 minutes)", () => {
        const pos = calculateAppointmentPosition("10:00", 15);
        // 0.5 slots * 32px + 0 internal boundaries = 16px
        expect(pos.heightPx).toBe(16);
      });

      it("should handle appointment crossing midnight conceptually", () => {
        // This tests the math, even though business logic might prevent it
        const pos = calculateAppointmentPosition("23:30", 60);
        // 47 slots * 32px + 24 hour boundaries * 2px
        expect(pos.topPx).toBe(47 * 32 + 24 * 2);
      });
    });
  });
});
