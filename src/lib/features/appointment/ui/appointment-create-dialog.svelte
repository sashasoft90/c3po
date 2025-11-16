<script lang="ts">
  import type { DateValue } from "@internationalized/date";
  import * as Drawer from "@/shared/ui/drawer";
  import { Button } from "@/shared/ui/button";
  import { Label } from "@/shared/ui/label";
  import { ServiceType, SERVICE_CONFIGS, type Client } from "@/shared/types";
  import { createAppointment } from "@/shared/api/appointments";

  let {
    open = $bindable(false),
    date,
    startTime,
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

  // Update duration when service type changes
  $effect(() => {
    if (!customDuration) {
      durationMinutes = SERVICE_CONFIGS[selectedServiceType].defaultDurationMinutes;
    }
  });

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

      await createAppointment({
        serviceType: selectedServiceType,
        clients: [client],
        date,
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
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>Новая запись</Drawer.Title>
      <Drawer.Description>
        Создание записи на {date.day}.{date.month}.{date.year} в {startTime}
      </Drawer.Description>
    </Drawer.Header>

    <form onsubmit={handleSubmit} class="space-y-4 p-4">
      <!-- Service Type -->
      <div class="space-y-2">
        <Label for="service-type">Услуга</Label>
        <select
          id="service-type"
          bind:value={selectedServiceType}
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {#each Object.values(ServiceType) as type (type)}
            <option value={type}>{SERVICE_CONFIGS[type].displayName}</option>
          {/each}
        </select>
      </div>

      <!-- Client Name -->
      <div class="space-y-2">
        <Label for="client-name">Имя клиента *</Label>
        <input
          id="client-name"
          type="text"
          bind:value={clientName}
          required
          placeholder="Введите имя"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        />
      </div>

      <!-- Client Phone -->
      <div class="space-y-2">
        <Label for="client-phone">Телефон</Label>
        <input
          id="client-phone"
          type="tel"
          bind:value={clientPhone}
          placeholder="+7 (___) ___-__-__"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        />
      </div>

      <!-- Duration -->
      <div class="space-y-2">
        <Label for="duration">
          Длительность (мин)
          {#if !customDuration}
            <span class="text-xs text-muted-foreground">
              (по умолчанию: {SERVICE_CONFIGS[selectedServiceType].defaultDurationMinutes})
            </span>
          {/if}
        </Label>
        <input
          id="duration"
          type="number"
          bind:value={durationMinutes}
          oninput={() => (customDuration = true)}
          min="15"
          step="15"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        />
      </div>

      <!-- Notes -->
      <div class="space-y-2">
        <Label for="notes">Заметки</Label>
        <textarea
          id="notes"
          bind:value={notes}
          rows="3"
          placeholder="Дополнительная информация"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        ></textarea>
      </div>

      <Drawer.Footer class="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting || !clientName.trim()} class="flex-1">
          {isSubmitting ? "Создание..." : "Создать запись"}
        </Button>
        <Drawer.Close>
          {#snippet child({ props })}
            <Button {...props} variant="outline" disabled={isSubmitting}>Отмена</Button>
          {/snippet}
        </Drawer.Close>
      </Drawer.Footer>
    </form>
  </Drawer.Content>
</Drawer.Root>
