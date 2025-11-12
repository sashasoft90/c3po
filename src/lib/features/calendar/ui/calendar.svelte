<script lang="ts">
  import { type DateValue, getLocalTimeZone, today } from "@internationalized/date";
  import Calendar from "../../../shared/ui/calendar/calendar.svelte";
  // noinspection ES6UnusedImports
  import * as Drawer from "@/shared/ui/drawer";
  import { Button } from "@/shared/ui/button";
  // noinspection ES6UnusedImports
  import CalendarPlusIcon from "@lucide/svelte/icons/calendar-plus";
  import { cn } from "@/shared/utils";

  let { value = $bindable<DateValue | undefined>(), class: className, id } = $props();

  let open = $state(false);

  const triggerLabel = $derived.by(() => {
    if (value) return value.toDate(getLocalTimeZone()).toLocaleDateString();
    return today(getLocalTimeZone()).toDate(getLocalTimeZone()).toLocaleDateString();
  });
</script>

<div class={cn("flex flex-col gap-3", className)}>
  <Drawer.Root bind:open>
    <Drawer.Trigger id="{id}-date">
      {#snippet child({ props })}
        <Button {...props} variant="outline" class="justify-between font-normal">
          {triggerLabel}
          <CalendarPlusIcon />
        </Button>
      {/snippet}
    </Drawer.Trigger>
    <Drawer.Content class="w-auto overflow-hidden p-0">
      <!-- todo: sr-only is useful for not seeing frames			-->
      <!--			<Drawer.Header class="sr-only">-->
      <!--				<Drawer.Title>Select date</Drawer.Title>-->
      <!--				<Drawer.Description>Set your date of birth</Drawer.Description>-->
      <!--			</Drawer.Header>-->
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
