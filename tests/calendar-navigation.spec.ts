import { test, expect } from "@playwright/test";

test.describe("Calendar Navigation Widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/planner");
  });

  test("should display calendar with navigation buttons", async ({ page }) => {
    // Check that navigation buttons are visible
    const prevButton = page.getByLabel("Previous day");
    const nextButton = page.getByLabel("Next day");

    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();

    // Check that calendar is visible
    const calendarTrigger = page.locator('[id$="-date"]').first();
    await expect(calendarTrigger).toBeVisible();
  });

  test("should display today's date initially", async ({ page }) => {
    const today = new Date();
    const todayFormatted = today.toLocaleDateString("en-US");

    // Check that today's date is displayed
    await expect(page.getByText(todayFormatted)).toBeVisible();
  });

  test("should navigate to previous day when clicking left button", async ({ page }) => {
    // Get today's date
    const today = new Date();
    const todayFormatted = today.toLocaleDateString("en-US");

    // Verify today is displayed
    await expect(page.getByText(todayFormatted)).toBeVisible();

    // Click previous button
    await page.getByLabel("Previous day").click();

    // Calculate yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toLocaleDateString("en-US");

    // Verify yesterday is now displayed
    await expect(page.getByText(yesterdayFormatted)).toBeVisible();
  });

  test("should navigate to next day when clicking right button", async ({ page }) => {
    // Get today's date
    const today = new Date();
    const todayFormatted = today.toLocaleDateString("en-US");

    // Verify today is displayed
    await expect(page.getByText(todayFormatted)).toBeVisible();

    // Click next button
    await page.getByLabel("Next day").click();

    // Calculate tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toLocaleDateString("en-US");

    // Verify tomorrow is now displayed
    await expect(page.getByText(tomorrowFormatted)).toBeVisible();
  });

  test("should handle multiple clicks correctly", async ({ page }) => {
    const today = new Date();
    const nextButton = page.getByLabel("Next day");

    // Click next button 3 times, waiting for date to change each time
    for (let i = 1; i <= 3; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() + i);
      const expectedFormatted = expectedDate.toLocaleDateString("en-US");

      await nextButton.click();
      await expect(page.getByText(expectedFormatted)).toBeVisible({ timeout: 10000 });
    }
  });

  test("should navigate backwards and forwards", async ({ page }) => {
    const today = new Date();
    const prevButton = page.getByLabel("Previous day");
    const nextButton = page.getByLabel("Next day");

    // Go back 5 days
    for (let i = 1; i <= 5; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedFormatted = expectedDate.toLocaleDateString("en-US");

      await prevButton.click();
      await expect(page.getByText(expectedFormatted)).toBeVisible({ timeout: 3000 });
    }

    // Go forward 3 days (from -5 to -2)
    for (let i = 1; i <= 3; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - (5 - i));
      const expectedFormatted = expectedDate.toLocaleDateString("en-US");

      await nextButton.click();
      await expect(page.getByText(expectedFormatted)).toBeVisible({ timeout: 3000 });
    }

    // Final check: should be 2 days ago
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoFormatted = twoDaysAgo.toLocaleDateString("en-US");
    await expect(page.getByText(twoDaysAgoFormatted)).toBeVisible();
  });

  test("should handle month boundaries correctly", async ({ page }) => {
    const prevButton = page.getByLabel("Previous day");

    // Go back 40 days to cross month boundary
    for (let i = 0; i < 40; i++) {
      await prevButton.click();
      // Small delay to ensure state updates
      await page.waitForTimeout(50);
    }

    // Calculate 40 days ago
    const today = new Date();
    const fortyDaysAgo = new Date(today);
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
    const fortyDaysAgoFormatted = fortyDaysAgo.toLocaleDateString("en-US");

    // Verify the date is correct
    await expect(page.getByText(fortyDaysAgoFormatted)).toBeVisible();
  });

  test("should open calendar drawer when clicking date button", async ({ page }) => {
    // Click on the date button - use force click for Chromium compatibility
    const calendarTrigger = page.locator('[id$="-date"]').first();
    await calendarTrigger.click({ force: true });

    // Wait for drawer content to appear
    await page.waitForTimeout(500);

    // Wait for drawer to open with longer timeout for animation
    const calendarGrid = page.locator('[role="grid"]');
    await expect(calendarGrid).toBeVisible({ timeout: 10000 });
  });

  test("should synchronize with calendar picker selection", async ({ page }) => {
    // Open calendar drawer - use force click for Chromium compatibility
    const calendarTrigger = page.locator('[id$="-date"]').first();
    await calendarTrigger.click({ force: true });

    // Wait for animation
    await page.waitForTimeout(500);

    // Wait for calendar to be visible with longer timeout
    const calendar = page.locator('[role="grid"]');
    await expect(calendar).toBeVisible({ timeout: 10000 });

    // Select a different date (e.g., 15th of current month)
    // This will depend on your calendar implementation
    const dateCell = page.locator('[role="gridcell"]').filter({ hasText: "15" }).first();
    await dateCell.click();

    // Wait for drawer to close
    await expect(calendar).not.toBeVisible();

    // Now test navigation buttons work with the new selected date
    await page.getByLabel("Next day").click();

    // Wait for date to update
    await page.waitForTimeout(200);

    // The date should now be 16th (if we selected 15th)
    const nextDay = page.locator('[id$="-date"]').first();
    await expect(nextDay).toContainText("16");
  });

  test("should have proper layout with flex-row and gap", async ({ page }) => {
    // Check that the container has flex-row class
    const container = page.locator(".flex.flex-row").first();
    await expect(container).toBeVisible();

    // Check that all three elements (prev button, calendar, next button) are present
    const prevButton = page.getByLabel("Previous day");
    const nextButton = page.getByLabel("Next day");
    const calendar = page.locator('[id$="-date"]').first();

    await expect(prevButton).toBeVisible();
    await expect(calendar).toBeVisible();
    await expect(nextButton).toBeVisible();
  });
});
