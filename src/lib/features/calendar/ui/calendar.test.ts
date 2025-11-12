import { describe, it, expect } from "vitest";
import { render } from "@testing-library/svelte";
import { today, getLocalTimeZone } from "@internationalized/date";
import Calendar from "./calendar.svelte";

describe("Calendar Feature", () => {
  it("should render with today's date by default", () => {
    const { container } = render(Calendar, {
      props: {
        id: "test-calendar",
        class: undefined,
      },
    });

    const todayDate = today(getLocalTimeZone()).toDate(getLocalTimeZone()).toLocaleDateString();
    expect(container.textContent).toContain(todayDate);
  });

  it("should display provided date value", () => {
    const testDate = today(getLocalTimeZone());
    const { container } = render(Calendar, {
      props: {
        value: testDate,
        id: "test-calendar",
        class: undefined,
      },
    });

    const formattedDate = testDate.toDate(getLocalTimeZone()).toLocaleDateString();
    expect(container.textContent).toContain(formattedDate);
  });

  it("should render with correct id", () => {
    const { container } = render(Calendar, {
      props: {
        id: "test-calendar",
        class: undefined,
      },
    });

    const trigger = container.querySelector('[id="test-calendar-date"]');
    expect(trigger).toBeTruthy();
  });

  it("should apply custom className", () => {
    const { container } = render(Calendar, {
      props: {
        class: "custom-test-class",
        id: "test-calendar",
      },
    });

    const wrapper = container.querySelector(".custom-test-class");
    expect(wrapper).toBeTruthy();
  });
});
