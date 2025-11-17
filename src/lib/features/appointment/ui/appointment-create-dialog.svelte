<script lang="ts">
  import { type DateValue } from "@internationalized/date";
  import CalendarIcon from "@lucide/svelte/icons/calendar";
  import * as Drawer from "@/shared/ui/drawer";
  import { Button } from "@/shared/ui/button";
  import { Label } from "@/shared/ui/label";
  import { Input } from "@/shared/ui/input";
  import * as Select from "@/shared/ui/select";
  import * as Textarea from "@/shared/ui/textarea";
  import * as Calendar from "@/shared/ui/calendar";
  import * as Carousel from "@/shared/ui/carousel";
  import { ServiceType, SERVICE_CONFIGS, type Client } from "@/shared/types";
  import { createAppointment } from "@/shared/api/appointments";

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

  let selectedServiceType = $state<ServiceType>(ServiceType.MANICURE);
  let clientName = $state("");
  let clientPhone = $state("");
  let customDuration = $state(false);
  let durationMinutes = $state(SERVICE_CONFIGS[ServiceType.MANICURE].defaultDurationMinutes);
  let notes = $state("");
  let isSubmitting = $state(false);

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
    return `${date.day.toString().padStart(2, "0")}.${date.month.toString().padStart(2, "0")}.${date.year}`;
  };

  // Update duration when service type changes
  $effect(() => {
    if (!customDuration) {
      durationMinutes = SERVICE_CONFIGS[selectedServiceType].defaultDurationMinutes;
    }
  });

  // Generate hour and minute options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minuteOptions = ["00", "15", "30", "45"];

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!clientName.trim()) return;

    isSubmitting = true;

    try {
      const client: Client = {
        id: crypto.randomUUID(),
        name: clientName.trim(),
        phone: clientPhone.trim() || undefined,
      };

      const startTime = `${selectedHour}:${selectedMinute}`;

      await createAppointment({
        serviceType: selectedServiceType,
        clients: [client],
        date: selectedDate,
        startTime,
        durationMinutes,
        notes: notes.trim() || undefined,
      });

      // Reset form
      clientName = "";
      clientPhone = "";
      notes = "";
      customDuration = false;
      open = false;

      onCreated?.();
    } catch (error) {
      console.error("Failed to create appointment:", error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Drawer.Root bind:open shouldScaleBackground={false}>
  <Drawer.Content class="max-h-[95vh]">
    <Drawer.Header class="pb-2">
      <Drawer.Title>New Appointment</Drawer.Title>
    </Drawer.Header>

    <form onsubmit={handleSubmit} class="space-y-3 overflow-y-auto px-4 pb-4">
      <!-- Service Type - Color Coded Carousel -->
      <div class="space-y-1.5">
        <Label class="text-xs">Service</Label>
        <Carousel.Carousel
          opts={{
            align: "start",
            slidesToScroll: 1,
          }}
          class="w-full"
        >
          <Carousel.CarouselContent class="-ml-4">
            {#each Object.values(ServiceType) as type (type)}
              {@const config = SERVICE_CONFIGS[type]}
              <Carousel.CarouselItem class="basis-1/2 sm:basis-1/3">
                <div class="">
                  <button
                    type="button"
                    onclick={() => (selectedServiceType = type)}
                    class="relative flex h-14 w-full items-center justify-center rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all {selectedServiceType ===
                    type
                      ? 'scale-100 border-foreground'
                      : 'border-transparent opacity-70 hover:opacity-100'} {config.color} text-white"
                  >
                    {config.displayName}
                    {#if selectedServiceType === type}
                      <span
                        class="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground"
                      >
                        <svg
                          class="h-3 w-3 text-background"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </span>
                    {/if}
                  </button>
                </div>
              </Carousel.CarouselItem>
            {/each}
          </Carousel.CarouselContent>
          <Carousel.CarouselPrevious class="left-0 h-7 w-7" />
          <Carousel.CarouselNext class="right-0 h-7 w-7" />
        </Carousel.Carousel>
      </div>

      <!-- Date and Time -->
      <div class="grid grid-cols-2 gap-2">
        <!-- Date Picker -->
        <div class="relative space-y-1.5">
          <Label class="text-xs">Date</Label>
          <Button
            onclick={() => (showCalendar = !showCalendar)}
            variant="outline"
            class="w-full min-w-32 flex-1 justify-between font-normal"
          >
            {formatDate(selectedDate)}
            <CalendarIcon />
          </Button>

          {#if showCalendar}
            <div
              class="top-full/2 absolute left-0 z-50 rounded-md border bg-background p-2 shadow-lg"
            >
              <Calendar.Calendar
                type="single"
                bind:value={selectedDate}
                captionLayout="dropdown"
                onValueChange={(v) => {
                  if (v) {
                    showCalendar = false;
                  }
                }}
              />
            </div>
          {/if}
        </div>

        <!-- Time Picker -->
        <div class="space-y-1.5">
          <Label class="text-xs">Time</Label>
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
          <div class="mt-1 text-xs text-muted-foreground">
            Duration: {durationMinutes} min
          </div>
        </div>
      </div>

      <!-- Client Info -->
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1.5">
          <Label for="client-name" class="text-xs">Client Name *</Label>
          <Input id="client-name" type="text" bind:value={clientName} required placeholder="Name" />
        </div>
        <div class="space-y-1.5">
          <Label for="client-phone" class="text-xs">Phone</Label>
          <Input id="client-phone" type="tel" bind:value={clientPhone} placeholder="+49" />
        </div>
      </div>

      <!-- Duration Override -->
      <div class="space-y-1.5">
        <Label for="duration" class="text-xs">
          Custom Duration (min)
          {#if !customDuration}
            <span class="text-muted-foreground"
              >(default: {SERVICE_CONFIGS[selectedServiceType].defaultDurationMinutes})</span
            >
          {/if}
        </Label>
        <Input
          id="duration"
          type="number"
          bind:value={durationMinutes}
          oninput={() => (customDuration = true)}
          min="15"
          step="15"
        />
      </div>

      <!-- Notes -->
      <div class="space-y-1.5">
        <Label for="notes" class="text-xs">Notes</Label>
        <Textarea.Root id="notes" bind:value={notes} placeholder="Additional info"></Textarea.Root>
      </div>

      <Drawer.Footer class="flex gap-2 px-0 pt-2">
        <Button type="submit" disabled={isSubmitting || !clientName.trim()} class="flex-1">
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </Drawer.Footer>
    </form>
  </Drawer.Content>
</Drawer.Root>
