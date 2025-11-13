import { describe, it, expect, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/svelte";
import { today, getLocalTimeZone } from "@internationalized/date";
import CalendarNavigation from "./calendar-navigation.svelte";

describe("CalendarNavigation Widget", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("should render calendar with left and right navigation buttons", () => {
    const { container } = render(CalendarNavigation);

    // Check for navigation buttons by aria-label
    const prevButton = container.querySelector('[aria-label="Previous day"]');
    const nextButton = container.querySelector('[aria-label="Next day"]');

    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
  });

  it("should display today's date by default", () => {
    const { container } = render(CalendarNavigation);

    const todayDate = today(getLocalTimeZone()).toDate(getLocalTimeZone()).toLocaleDateString();
    expect(container.textContent).toContain(todayDate);
  });

  it("should navigate to previous day when left button is clicked", async () => {
    const { container } = render(CalendarNavigation);

    const prevButton = container.querySelector('[aria-label="Previous day"]');
    if (prevButton) {
      await fireEvent.click(prevButton);

      // Date should be yesterday
      const yesterday = today(getLocalTimeZone())
        .subtract({ days: 1 })
        .toDate(getLocalTimeZone())
        .toLocaleDateString();

      expect(container.textContent).toContain(yesterday);
    }
  });

  it("should navigate to next day when right button is clicked", async () => {
    const { container } = render(CalendarNavigation);

    const nextButton = container.querySelector('[aria-label="Next day"]');
    if (nextButton) {
      await fireEvent.click(nextButton);

      // Date should be tomorrow
      const tomorrow = today(getLocalTimeZone())
        .add({ days: 1 })
        .toDate(getLocalTimeZone())
        .toLocaleDateString();

      expect(container.textContent).toContain(tomorrow);
    }
  });

  it("should handle multiple clicks on navigation buttons", async () => {
    const { container } = render(CalendarNavigation);

    const nextButton = container.querySelector('[aria-label="Next day"]');

    if (nextButton) {
      // Click 3 times
      await fireEvent.click(nextButton);
      await fireEvent.click(nextButton);
      await fireEvent.click(nextButton);

      // Date should be 3 days from today
      const threeDaysLater = today(getLocalTimeZone())
        .add({ days: 3 })
        .toDate(getLocalTimeZone())
        .toLocaleDateString();

      expect(container.textContent).toContain(threeDaysLater);
    }
  });

  it("should navigate backwards and forwards correctly", async () => {
    const { container } = render(CalendarNavigation);

    const prevButton = container.querySelector('[aria-label="Previous day"]');
    const nextButton = container.querySelector('[aria-label="Next day"]');

    if (prevButton && nextButton) {
      // Go back 2 days
      await fireEvent.click(prevButton);
      await fireEvent.click(prevButton);

      // Then forward 1 day
      await fireEvent.click(nextButton);

      // Should be yesterday
      const yesterday = today(getLocalTimeZone())
        .subtract({ days: 1 })
        .toDate(getLocalTimeZone())
        .toLocaleDateString();

      expect(container.textContent).toContain(yesterday);
    }
  });

  it("should apply custom className", () => {
    const { container } = render(CalendarNavigation, {
      props: {
        class: "custom-nav-class",
      },
    });

    const wrapper = container.querySelector(".custom-nav-class");
    expect(wrapper).toBeTruthy();
  });

  it("should use custom id when provided", () => {
    const { container } = render(CalendarNavigation, {
      props: {
        id: "custom-calendar-id",
        class: undefined,
      },
    });

    // Check that the calendar uses the custom ID
    const trigger = container.querySelector('[id="custom-calendar-id-date"]');
    expect(trigger).toBeTruthy();
  });

  it("should render Today button", () => {
    const { container } = render(CalendarNavigation);

    const todayButton = container.querySelector('[aria-label="Reset to today"]');
    expect(todayButton).toBeTruthy();
    expect(todayButton?.textContent).toContain("Today");
  });

  it("should reset to today when Today button is clicked", async () => {
    const { container } = render(CalendarNavigation);

    const nextButton = container.querySelector('[aria-label="Next day"]');
    const todayButton = container.querySelector('[aria-label="Reset to today"]');

    // Navigate forward 5 days
    if (nextButton) {
      for (let i = 0; i < 5; i++) {
        await fireEvent.click(nextButton);
      }
    }

    // Verify we're 5 days ahead
    const fiveDaysLater = today(getLocalTimeZone())
      .add({ days: 5 })
      .toDate(getLocalTimeZone())
      .toLocaleDateString();
    expect(container.textContent).toContain(fiveDaysLater);

    // Click Today button
    if (todayButton) {
      await fireEvent.click(todayButton);
    }

    // Should be back to today
    const todayDate = today(getLocalTimeZone()).toDate(getLocalTimeZone()).toLocaleDateString();
    expect(container.textContent).toContain(todayDate);
  });

  it("should save date to localStorage when navigating", async () => {
    const { container } = render(CalendarNavigation);

    const nextButton = container.querySelector('[aria-label="Next day"]');

    if (nextButton) {
      await fireEvent.click(nextButton);
    }

    // Check that localStorage was updated
    const savedDate = localStorage.getItem("calendar-navigation-date");
    expect(savedDate).toBeTruthy();

    // Verify the saved date is tomorrow
    const tomorrow = today(getLocalTimeZone()).add({ days: 1 });
    expect(savedDate).toBe(tomorrow.toString());
  });

  it("should load date from localStorage on mount", () => {
    // Set a date in localStorage (3 days from today)
    const threeDaysLater = today(getLocalTimeZone()).add({ days: 3 });
    localStorage.setItem("calendar-navigation-date", threeDaysLater.toString());

    // Render component
    const { container } = render(CalendarNavigation);

    // Should display the saved date
    const expectedDate = threeDaysLater.toDate(getLocalTimeZone()).toLocaleDateString();
    expect(container.textContent).toContain(expectedDate);
  });

  it("should fall back to today if localStorage has invalid date", () => {
    // Set invalid date in localStorage
    localStorage.setItem("calendar-navigation-date", "invalid-date-string");

    // Render component
    const { container } = render(CalendarNavigation);

    // Should display today's date
    const todayDate = today(getLocalTimeZone()).toDate(getLocalTimeZone()).toLocaleDateString();
    expect(container.textContent).toContain(todayDate);
  });
});
