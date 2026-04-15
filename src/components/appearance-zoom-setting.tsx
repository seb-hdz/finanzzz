"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <Label className="text-sm font-medium leading-none">
            Nivel de zoom
          </Label>
          <p className="text-xs text-muted-foreground">
            Escala el tamaño del texto y los controles.
          </p>
        </div>
        {/* <span
          className="shrink-0 rounded-md border border-border/60 bg-muted/40 px-2 py-1 font-mono text-xs font-medium tabular-nums text-foreground"
          aria-live="polite"
        >
          {percent}%
        </span> */}
      </div>

      <div className="max-w-full lg:max-w-2/3 lg:mx-auto mt-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0 rounded-full"
            disabled={trackIndex <= 0}
            onClick={() => {
              const next = UI_ZOOM_STEPS[trackIndex - 1];
              setTrackIndex(trackIndex - 1);
              void pick(next, "now");
            }}
            aria-label="Reducir zoom"
          >
            <Minus className="size-4" />
          </Button>
          <input
            type="range"
            className={cn(
              "h-2 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-muted",
              "accent-primary",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm",
              "[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm"
            )}
            aria-valuemin={0}
            aria-valuemax={UI_ZOOM_STEPS.length - 1}
            aria-valuenow={trackIndex}
            aria-valuetext={`${UI_ZOOM_STEPS[trackIndex]} por ciento`}
            aria-label="Nivel de zoom"
            min={0}
            max={UI_ZOOM_STEPS.length - 1}
            step={1}
            value={trackIndex}
            onChange={(e) => {
              const i = Number(e.currentTarget.value);
              const next = UI_ZOOM_STEPS[i];
              setTrackIndex(i);
              void pick(next, "debounced");
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0 rounded-full"
            disabled={trackIndex >= UI_ZOOM_STEPS.length - 1}
            onClick={() => {
              const next = UI_ZOOM_STEPS[trackIndex + 1];
              setTrackIndex(trackIndex + 1);
              void pick(next, "now");
            }}
            aria-label="Aumentar zoom"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div
          className="flex flex-wrap justify-between gap-x-1 mt-2 mx-4"
          role="group"
          aria-label="Porcentajes de zoom"
        >
          {UI_ZOOM_STEPS.map((step) => (
            <Button
              key={step}
              type="button"
              size="sm"
              variant={step === percent ? "default" : "ghost"}
              className="ml-4 min-w-[2.85rem] px-2 font-mono text-xs tabular-nums"
              onClick={() => {
                setTrackIndex(UI_ZOOM_STEPS.indexOf(step));
                void pick(step, "now");
              }}
            >
              {step}%
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
