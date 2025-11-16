<script lang="ts">
  import type { DateValue } from "@internationalized/date";
  import { cn } from "@/shared/utils";

  let {
    day,
    timeSlots,
    showIntermediateLabels = false,
    dropTargetSlot = null,
    onSlotClick,
    onSlotMouseEnter,
    onSlotMouseLeave,
    onSlotMouseUp,
    onSlotKeydown,
    class: className = "",
  } = $props<{
    day: DateValue;
    timeSlots: Array<{ time: string; isHourStart: boolean }>;
    showIntermediateLabels?: boolean;
    dropTargetSlot?: { day: DateValue; time: string } | null;
    onSlotClick?: (day: DateValue, time: string) => void;
    onSlotMouseEnter?: (day: DateValue, time: string) => void;
    onSlotMouseLeave?: () => void;
    onSlotMouseUp?: (day: DateValue, time: string) => void;
    onSlotKeydown?: (event: KeyboardEvent, day: DateValue, time: string) => void;
    class?: string;
  }>();

  function isDropTarget(time: string): boolean {
    if (!dropTargetSlot) return false;
    return dropTargetSlot.day.compare(day) === 0 && dropTargetSlot.time === time;
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
        onmouseenter={() => onSlotMouseEnter?.(day, time)}
        onmouseleave={() => onSlotMouseLeave?.()}
        onmouseup={() => onSlotMouseUp?.(day, time)}
        class={cn(
          "h-8 flex-1 cursor-pointer rounded border-x border-dashed border-border/100 transition-colors",
          "hover:border-border/50 hover:bg-accent/20",
          "active:border-border/50 active:bg-accent/30",
          !isHourStart ? "border-t border-t-border/100" : "",
          isDropTarget(time) && "border-primary bg-primary/20"
        )}
      ></div>
    </div>
  {/each}
</div>
