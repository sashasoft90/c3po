<script lang="ts">
  import type { DateValue } from "@internationalized/date";
  import { cn } from "@/shared/utils";

  let {
    day,
    timeSlots,
    showIntermediateLabels = false,
    dropTargetSlot = null,
    onSlotClick,
    onSlotMouseMove,
    onSlotMouseEnter,
    onSlotMouseLeave,
    onSlotMouseUp,
    onSlotTouchMove,
    onSlotTouchStart,
    onSlotTouchEnd,
    onSlotKeydown,
    class: className = "",
  } = $props<{
    day: DateValue;
    timeSlots: Array<{ time: string; isHourStart: boolean }>;
    showIntermediateLabels?: boolean;
    dropTargetSlot?: { day: DateValue; time: string } | null;
    onSlotClick?: (day: DateValue, time: string) => void;
    onSlotMouseMove?: (day: DateValue, time: string, event: MouseEvent) => void;
    onSlotMouseEnter?: (day: DateValue, time: string, event: MouseEvent) => void;
    onSlotMouseLeave?: () => void;
    onSlotMouseUp?: (day: DateValue, time: string) => void;
    onSlotTouchMove?: (day: DateValue, time: string, event: TouchEvent) => void;
    onSlotTouchStart?: (day: DateValue, time: string, event: TouchEvent) => void;
    onSlotTouchEnd?: (day: DateValue, time: string) => void;
    onSlotKeydown?: (event: KeyboardEvent, day: DateValue, time: string) => void;
    class?: string;
  }>();

  // Helper to check if this slot contains the drop target
  function isDropTarget(slotTime: string): boolean {
    if (!dropTargetSlot) return false;
    if (dropTargetSlot.day.compare(day) !== 0) return false;

    // Convert times to minutes for comparison
    const slotMinutes = timeToMinutes(slotTime);
    const targetMinutes = timeToMinutes(dropTargetSlot.time);

    // Check if target time falls within this slot (30-minute slots)
    // For example: slot "09:00" contains times from 09:00 to 09:29
    // slot "09:30" contains times from 09:30 to 09:59
    return targetMinutes >= slotMinutes && targetMinutes < slotMinutes + 30;
  }

  // Helper to get the position of drop target within slot (for visual indicator)
  function getDropTargetPosition(slotTime: string): "upper" | "lower" | null {
    if (!isDropTarget(slotTime)) return null;
    if (!dropTargetSlot) return null;

    const slotMinutes = timeToMinutes(slotTime);
    const targetMinutes = timeToMinutes(dropTargetSlot.time);
    const relativeMinutes = targetMinutes - slotMinutes;

    // Upper half: 0-14 minutes (00:00, 00:15 → upper)
    // Lower half: 15-29 minutes (00:15, 00:30 → lower)
    return relativeMinutes < 15 ? "upper" : "lower";
  }

  // Convert time string to minutes
  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
</script>

<div class={cn("flex flex-col gap-0", className)}>
  {#each timeSlots as { time, isHourStart } (time)}
    <div class={cn("flex items-center gap-2", isHourStart ? "border-t-2 border-t-border" : "")}>
      {#if isHourStart || showIntermediateLabels}
        <span
          class={cn(
            "w-12 text-sm",
            isHourStart ? "text-base font-bold" : "font-normal text-muted-foreground"
          )}
        >
          {time}
        </span>
      {:else}
        <span class="w-12"></span>
      {/if}
      <div
        role="button"
        tabindex="0"
        onclick={() => onSlotClick?.(day, time)}
        onkeydown={(e) => onSlotKeydown?.(e, day, time)}
        onmousemove={(e) => onSlotMouseMove?.(day, time, e)}
        onmouseenter={(e) => onSlotMouseEnter?.(day, time, e)}
        onmouseleave={() => onSlotMouseLeave?.()}
        onmouseup={() => onSlotMouseUp?.(day, time)}
        ontouchmove={(e) => onSlotTouchMove?.(day, time, e)}
        ontouchstart={(e) => onSlotTouchStart?.(day, time, e)}
        ontouchend={() => onSlotTouchEnd?.(day, time)}
        class={cn(
          "relative h-8 flex-1 cursor-pointer rounded border-x border-dashed border-border/100 transition-all duration-150",
          "hover:border-border/50 hover:bg-accent/20",
          "active:border-border/50 active:bg-accent/30",
          !isHourStart ? "border-t border-t-border/100" : "",
          isDropTarget(time) && "!border-primary/50 !bg-primary/20 ring-2 ring-primary/30"
        )}
      >
        {#if isDropTarget(time)}
          {@const position = getDropTargetPosition(time)}
          <div
            class={cn(
              "absolute right-0 left-0 h-1/2 border-2 border-primary/60 bg-primary/30",
              position === "upper" ? "top-0 rounded-t" : "bottom-0 rounded-b"
            )}
          ></div>
        {/if}
      </div>
    </div>
  {/each}
</div>
