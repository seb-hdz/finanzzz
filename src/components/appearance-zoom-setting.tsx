"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  UI_ZOOM_STEPS,
  normalizeUiZoomPercent,
  type UiZoomPercent,
} from "@/lib/ui-zoom";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onSave: (percent: UiZoomPercent) => Promise<void>;
  className?: string;
};

export function AppearanceZoomSetting({ value, onSave, className }: Props) {
  const percent = normalizeUiZoomPercent(value);
  const index = UI_ZOOM_STEPS.indexOf(percent);
  const [trackIndex, setTrackIndex] = useState(index);

  useEffect(() => {
    setTrackIndex(UI_ZOOM_STEPS.indexOf(percent));
  }, [percent]);

  const toastTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (toastTimerRef.current !== undefined) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

  async function pick(next: UiZoomPercent, toastMode: "now" | "debounced") {
    await onSave(next);
    window.clearTimeout(toastTimerRef.current);
    if (toastMode === "now") {
      toast.success("Configuración guardada");
    } else {
      toastTimerRef.current = window.setTimeout(() => {
        toast.success("Configuración guardada");
      }, 380);
    }
  }

  const maxIndex = UI_ZOOM_STEPS.length - 1;
  const fillPct = maxIndex > 0 ? (trackIndex / maxIndex) * 100 : 100;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-semibold text-foreground">Nivel de zoom</p>
      <p className="text-xs text-muted-foreground -mt-2">
        Escala el tamaño del texto y los controles.
      </p>

      <div
        className={cn(
          "flex items-center gap-3 border border-border/50 py-3 pl-4 pr-4 rounded-lg bg-muted/30 relative pb-4.5"
        )}
      >
        <p className="text-xs text-foreground border border-border/50 rounded-full px-2 py-1 absolute bottom-1.5 left-1/2 -translate-x-1/2">
          {UI_ZOOM_STEPS[trackIndex]}%
        </p>
        <span
          className="select-none font-semibold leading-none text-foreground/80 tabular-nums"
          style={{ fontSize: "0.7rem" }}
          aria-hidden
        >
          A
        </span>

        <div className="relative min-w-0 flex-1 py-1">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-400/35 dark:bg-zinc-500/35"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
              style={{ width: `${fillPct}%` }}
            />
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-0"
            aria-hidden
          >
            {UI_ZOOM_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "shrink-0 rounded-full transition-colors duration-150",
                  i <= trackIndex
                    ? "h-1 w-px bg-primary"
                    : "h-1.5 w-[2px] bg-zinc-400/55 dark:bg-zinc-400/45"
                )}
              />
            ))}
          </div>

          <input
            id="appearance-ui-zoom"
            type="range"
            className={cn(
              "relative z-10 h-8 w-full min-w-0 cursor-pointer appearance-none bg-transparent",
              "[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent",
              "[&::-webkit-slider-thumb]:-mt-[1px] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-sm",
              "[&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-none",
              "[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent",
              "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-1 [&::-moz-range-thumb]:rounded-sm [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-none"
            )}
            aria-valuemin={0}
            aria-valuemax={maxIndex}
            aria-valuenow={trackIndex}
            aria-valuetext={`${UI_ZOOM_STEPS[trackIndex]} por ciento`}
            aria-label="Tamaño del texto"
            min={0}
            max={maxIndex}
            step={1}
            value={trackIndex}
            onChange={(e) => {
              const i = Number(e.currentTarget.value);
              const next = UI_ZOOM_STEPS[i];
              setTrackIndex(i);
              void pick(next, "debounced");
            }}
          />
        </div>

        <span
          className="select-none font-semibold leading-none text-foreground/80 tabular-nums"
          style={{ fontSize: "1.35rem" }}
          aria-hidden
        >
          A
        </span>
      </div>
    </div>
  );
}
