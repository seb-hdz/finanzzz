"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { LimitInterval } from "@/lib/types";

const LIMIT_INTERVALS: LimitInterval[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

/** Etiquetas para formularios (p. ej. Ajustes). */
export const LIMIT_INTERVAL_LABELS_FIELD: Record<LimitInterval, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

/** Etiquetas en frase (p. ej. “Resumen de gastos …”). */
export const LIMIT_INTERVAL_LABELS_PHRASE: Record<LimitInterval, string> = {
  daily: "hoy",
  weekly: "esta semana",
  monthly: "este mes",
  yearly: "este año",
};

type LimitIntervalSelectProps = {
  value: LimitInterval;
  onValueChange: (value: LimitInterval) => void | Promise<void>;
  disabled?: boolean;
  /** `field`: trigger estándar de formulario. `inline`: texto con subrayado (dashboard). */
  variant?: "field" | "inline";
};

export function LimitIntervalSelect({
  value,
  onValueChange,
  disabled,
  variant = "field",
}: LimitIntervalSelectProps) {
  const labels =
    variant === "inline" ? LIMIT_INTERVAL_LABELS_PHRASE : LIMIT_INTERVAL_LABELS_FIELD;

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(v) => {
        if (!v) return;
        void onValueChange(v as LimitInterval);
      }}
    >
      <SelectTrigger
        size={variant === "inline" ? "sm" : "default"}
        className={
          variant === "inline"
            ? "group h-auto min-h-0 w-fit max-w-[min(100%,12rem)] border-0 bg-transparent px-0 py-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 data-[size=sm]:h-auto gap-0.5"
            : undefined
        }
      >
        <span
          data-slot="select-value"
          className="text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors duration-200 ease-out group-hover:text-foreground"
        >
          {labels[value]}
        </span>
      </SelectTrigger>
      <SelectContent>
        {LIMIT_INTERVALS.map((key) => (
          <SelectItem key={key} value={key}>
            {labels[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
