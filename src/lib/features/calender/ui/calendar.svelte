<script lang="ts">
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
	import { Button } from '@/shared/ui/button';
	import Calendar from '../../../shared/ui/calendar/calendar.svelte';
	import * as Drawer from '@/shared/ui/drawer';
	import { Label } from '@/shared/ui/label';

	let open = $state(false);
	let value = $state<DateValue | undefined>();
	const id = $props.id();

	const triggerLabel = $derived.by(() => {
		if (value) return value.toDate(getLocalTimeZone()).toLocaleDateString();
		return today(getLocalTimeZone()).toDate(getLocalTimeZone()).toLocaleDateString();
	});
</script>

<div class="flex flex-col gap-3">
	<Drawer.Root bind:open>
		<Drawer.Trigger id="{id}-date">
			{#snippet child({ props })}
				<Button {...props} variant="outline" class="w-48 justify-between font-normal">
					{triggerLabel}
					<CalendarPlusIcon />
				</Button>
			{/snippet}
		</Drawer.Trigger>
		<Drawer.Content class="w-auto overflow-hidden p-0">
			<Drawer.Header class="sr-only">
				<Drawer.Title>Select date</Drawer.Title>
				<Drawer.Description>Set your date of birth</Drawer.Description>
			</Drawer.Header>
			<Calendar
				type="single"
				bind:value
				captionLayout="dropdown"
				onValueChange={(v) => {
					if (v) {
						open = false;
					}
				}}
				class="mx-auto [--cell-size:clamp(0px,calc(100vw/7.5),52px)]"
			/>
		</Drawer.Content>
	</Drawer.Root>
</div>
