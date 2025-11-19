<script lang="ts">
  import { type DateValue } from "@internationalized/date";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import * as Drawer from "@/shared/ui/drawer";
  import { Button } from "@/shared/ui/button";
  import { Input } from "@/shared/ui/input";
  import * as Field from "@/shared/ui/field";
  import * as Select from "@/shared/ui/select";
  import * as Textarea from "@/shared/ui/textarea";
  import * as Calendar from "@/shared/ui/calendar";
  import * as Popover from "@/shared/ui/popover";
  import { PhoneInput } from "@/shared/ui/phone-input";
  import {
    ServiceType,
    SERVICE_CONFIGS,
    type Client,
    timeToMinutes,
    minutesToTime,
  } from "@/shared/types";
  import { createAppointment } from "@/shared/api/appointments";
  import { cn } from "@/shared/utils.js";

  let {
    open = $bindable(false),
    date: initialDate,
    startTime: initialStartTime,
    onCreated,
  } = $props<{
    open: boolean;
    date: DateValue;
    startTime: string;
    onCreated?: () => void;
  }>();

  let selectedServiceType = $state<Array<ServiceType>>([]);
  let clientName = $state("");
  let clientPhone = $state<string | null>(null);
  let notes = $state("");
  let customDurations = $state<Record<ServiceType, number>>({} as Record<ServiceType, number>);

  let isEmptySelectedServiceType = $derived(selectedServiceType.length === 0);

  // Get duration for a service (custom or default)
  function getServiceDuration(type: ServiceType): number {
    return customDurations[type] ?? SERVICE_CONFIGS[type]?.defaultDurationMinutes ?? 60;
  }

  let totalDuration = $derived(
    selectedServiceType.reduce((sum, type) => sum + getServiceDuration(type), 0)
  );

  // Date and time state
  let selectedDate = $state<DateValue>(initialDate);
  let selectedHour = $state(initialStartTime.split(":")[0]);
  let selectedMinute = $state(initialStartTime.split(":")[1]);
  let showCalendar = $state(false);

  // Update date and time when props change
  $effect(() => {
    selectedDate = initialDate;
    selectedHour = initialStartTime.split(":")[0];
    selectedMinute = initialStartTime.split(":")[1];
  });

  // Format date for display
  const formatDate = (date: DateValue) => {
    return `${date.day.toString().padStart(2, "0")}.${date.month
      .toString()
      .padStart(2, "0")}.${date.year}`;
  };

  // Generate hour and minute options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minuteOptions = ["00", "15", "30", "45"];

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!clientName.trim() || selectedServiceType.length === 0) return;

    try {
      const client: Client = {
        id: crypto.randomUUID(),
        name: clientName.trim(),
        phone: clientPhone || undefined,
      };

      let currentStartTime = `${selectedHour}:${selectedMinute}`;

      // Create appointments for each selected service type sequentially
      for (const serviceType of selectedServiceType) {
        const serviceDuration = getServiceDuration(serviceType);

        await createAppointment({
          serviceType,
          clients: [client],
          date: selectedDate,
          startTime: currentStartTime,
          durationMinutes: serviceDuration,
          notes: notes.trim() || undefined,
        });

        // Calculate next start time
        const currentMinutes = timeToMinutes(currentStartTime);
        const nextMinutes = currentMinutes + serviceDuration;
        currentStartTime = minutesToTime(nextMinutes);
      }

      // Reset form
      clientName = "";
      clientPhone = null;
      notes = "";
      selectedServiceType = [];
      customDurations = {} as Record<ServiceType, number>;
      open = false;

      onCreated?.();
    } catch (error) {
      console.error("Failed to create appointment:", error);
    }
  }
</script>

<Drawer.Root bind:open shouldScaleBackground={false}>
  <Drawer.Content class="max-h-[95vh]">
    <form onsubmit={handleSubmit} class="w-full space-y-3 overflow-y-auto px-4 pb-4">
      <Field.Group>
        <Field.Set>
          <Field.Legend>New Appointment</Field.Legend>
        </Field.Set>

        <!-- Service Type -->
        <Field.Field>
          <Field.Label for="select-service">Service</Field.Label>
          <Select.Root type="multiple" bind:value={selectedServiceType}>
            <Select.Trigger id="select-service" class="flex flex-row">
              {#if isEmptySelectedServiceType}
                <span>Select Service</span>
              {:else}
                <div class="flex flex-row gap-2">
                  {#each selectedServiceType as type (type)}
                    {@const config = SERVICE_CONFIGS[type]}
                    <span class={cn("rounded-md px-2", config.color)}>{config.displayName}</span>
                  {/each}
                </div>
              {/if}
            </Select.Trigger>
            <Select.Content>
              {#each Object.values(ServiceType) as type (type)}
                {@const config = SERVICE_CONFIGS[type]}
                <Select.Item class={cn("flex-none", config.color)} value={type}
                  >{config.displayName}</Select.Item
                >
              {/each}
            </Select.Content>
          </Select.Root>
        </Field.Field>

        <!-- Date and Time -->
        <Field.Group class="grid grid-cols-2 gap-2">
          <!-- Date Picker -->
          <Field.Field>
            <Field.Label>Date</Field.Label>
            <Popover.Root bind:open={showCalendar}>
              <Popover.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="outline"
                    class="h-9 w-full justify-between font-normal"
                  >
                    {formatDate(selectedDate)}
                    <CalendarIcon />
                  </Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content class="w-auto p-0" align="start">
                <Calendar.Calendar
                  type="single"
                  bind:value={selectedDate}
                  onValueChange={(v) => {
                    if (v) {
                      showCalendar = false;
                    }
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </Field.Field>

          <!-- Time Picker -->
          <Field.Field>
            <Field.Label>Time</Field.Label>
            <div class="flex items-center gap-2">
              <Select.Root type="single" bind:value={selectedHour}>
                <Select.Trigger class="h-auto flex-1 px-2 py-1.5 text-sm">
                  <span>{selectedHour}</span>
                </Select.Trigger>
                <Select.Content>
                  {#each hourOptions as hour (hour)}
                    <Select.Item value={hour}>{hour}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
              <span class="text-sm font-medium">:</span>
              <Select.Root type="single" bind:value={selectedMinute}>
                <Select.Trigger class="h-auto flex-1 px-2 py-1.5 text-sm">
                  <span>{selectedMinute}</span>
                </Select.Trigger>
                <Select.Content>
                  {#each minuteOptions as minute (minute)}
                    <Select.Item value={minute}>{minute}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
            <Field.Description>Duration: {totalDuration} min</Field.Description>
          </Field.Field>
        </Field.Group>

        <!-- Client Info -->
        <Field.Group class="grid grid-cols-2 gap-2">
          <Field.Field>
            <Field.Label for="client-name">Client Name *</Field.Label>
            <Input
              id="client-name"
              type="text"
              bind:value={clientName}
              required
              placeholder="Name"
            />
          </Field.Field>
          <Field.Field>
            <Field.Label>Phone</Field.Label>
            <PhoneInput bind:value={clientPhone} defaultCountry="DE" />
          </Field.Field>
        </Field.Group>

        <!-- Duration Override per Service -->
        {#if selectedServiceType.length > 0}
          <Field.Field>
            <Field.Label>Duration per Service</Field.Label>
            <div class="space-y-2">
              {#each selectedServiceType as type (type)}
                {@const config = SERVICE_CONFIGS[type]}
                {@const defaultMin = config.defaultDurationMinutes}
                <div class="flex items-center gap-2">
                  <span class={cn("rounded-md px-2 py-1 text-xs", config.color)}>
                    {config.displayName}
                  </span>
                  <Input
                    type="number"
                    class="h-8 w-20"
                    value={customDurations[type] ?? defaultMin}
                    oninput={(e) => {
                      customDurations[type] = parseInt(e.currentTarget.value) || defaultMin;
                    }}
                    min="15"
                    step="15"
                  />
                  <span class="text-xs text-muted-foreground">min</span>
                </div>
              {/each}
            </div>
          </Field.Field>
        {/if}

        <!-- Notes -->
        <Field.Field>
          <Field.Label for="notes">Notes</Field.Label>
          <Textarea.Root id="notes" bind:value={notes} placeholder="Additional info"
          ></Textarea.Root>
        </Field.Field>
      </Field.Group>

      <Drawer.Footer class="flex gap-2 px-0 pt-2">
        <Button type="submit" class="flex-1">Create</Button>
      </Drawer.Footer>
    </form>
  </Drawer.Content>
</Drawer.Root>
