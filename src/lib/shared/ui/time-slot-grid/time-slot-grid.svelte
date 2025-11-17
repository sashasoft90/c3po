<script lang="ts">
  import type { DateValue } from "@internationalized/date";
  import { cn } from "@/shared/utils";

  let {
    day,
    timeSlots,
    showIntermediateLabels = false,
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
          "h-8 flex-1 cursor-pointer rounded border-x border-dashed border-border/100 transition-colors",
          "hover:border-border/50 hover:bg-accent/20",
          "active:border-border/50 active:bg-accent/30",
          !isHourStart ? "border-t border-t-border/100" : ""
        )}
      ></div>
    </div>
  {/each}
</div>
