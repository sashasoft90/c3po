import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { today, getLocalTimeZone } from '@internationalized/date';
import CalendarNavigation from './calendar-navigation.svelte';

describe('CalendarNavigation Widget', () => {
	it('should render calendar with left and right navigation buttons', () => {
		const { container } = render(CalendarNavigation);

		// Check for navigation buttons by aria-label
		const prevButton = container.querySelector('[aria-label="Previous day"]');
		const nextButton = container.querySelector('[aria-label="Next day"]');

		expect(prevButton).toBeTruthy();
		expect(nextButton).toBeTruthy();
	});

	it('should display today\'s date by default', () => {
		const { container } = render(CalendarNavigation);

		const todayDate = today(getLocalTimeZone()).toDate(getLocalTimeZone()).toLocaleDateString();
		expect(container.textContent).toContain(todayDate);
	});

	it('should navigate to previous day when left button is clicked', async () => {
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

	it('should navigate to next day when right button is clicked', async () => {
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

	it('should handle multiple clicks on navigation buttons', async () => {
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

	it('should navigate backwards and forwards correctly', async () => {
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

	it('should apply custom className', () => {
		const { container } = render(CalendarNavigation, {
			props: {
				class: 'custom-nav-class'
			}
		});

		const wrapper = container.querySelector('.custom-nav-class');
		expect(wrapper).toBeTruthy();
	});

	it('should use custom id when provided', () => {
		const { container } = render(CalendarNavigation, {
			props: {
				id: 'custom-calendar-id'
			}
		});

		// Check that the calendar uses the custom ID
		const trigger = container.querySelector('[id="custom-calendar-id-date"]');
		expect(trigger).toBeTruthy();
	});
});
