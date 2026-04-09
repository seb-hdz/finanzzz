"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpNarrowWide,
  Clock,
  Layers,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getNonSharedTypeFilterTriggerIcon,
  SourceTypeIcon,
} from "@/components/source-type-icon";
import type { SourceType } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/types";

export type SourceSort =
  | "created"
  | "expenses_desc"
  | "expenses_asc"
  | "name"
  | "type";

export type SharedSourceSort = Exclude<SourceSort, "type">;

export const SOURCE_SORT_LABELS: Record<SourceSort, string> = {
  created: "Nuevas",
  expenses_desc: "Más gastos",
  expenses_asc: "Menos gastos",
  name: "Alfabético",
  type: "Por tipo",
};

const SOURCE_SORT_ICONS: Record<SourceSort, LucideIcon> = {
  created: Clock,
  expenses_desc: ArrowDownWideNarrow,
  expenses_asc: ArrowUpNarrowWide,
  name: ArrowDownAZ,
  type: Layers,
};

const NON_SHARED_TYPES = [
  "bank_account",
  "mobile_payment",
  "debit_card",
  "credit_card",
] as const satisfies readonly Exclude<SourceType, "shared">[];

export type NonSharedTypeFilter = "all" | (typeof NON_SHARED_TYPES)[number];

/**
 * `SelectTrigger` base trae `w-fit`; con `w-full min-[410px]:w-fit`, tailwind-merge
 * quita ese `w-fit` y el ancho completo aplica debajo de 410px (misma franja que
 * `sources/page.tsx`, max-width 409px).
 */
export const SOURCE_FILTER_SELECT_TRIGGER_CLASS = cn(
  "w-full min-[410px]:w-fit min-w-0 min-[410px]:min-w-38 max-w-none min-[410px]:max-w-[min(100vw-2rem,14rem)]"
);

/** Filtro de tipo: etiquetas largas; mismas reglas de ancho que el sort. */
export const NON_SHARED_TYPE_FILTER_TRIGGER_CLASS = cn(
  "w-full min-[410px]:w-fit min-w-0 min-[410px]:min-w-44 max-w-none min-[410px]:max-w-[min(100vw-2rem,14rem)]"
);

export const SHARED_SOURCE_SORT_OPTIONS: SharedSourceSort[] = [
  "created",
  "expenses_desc",
  "expenses_asc",
  "name",
];

export const ALL_SOURCE_SORT_OPTIONS: SourceSort[] = [
  ...SHARED_SOURCE_SORT_OPTIONS,
  "type",
];

export function SortOrderSelect<T extends string>({
  value,
  optionKeys,
  labels,
  onValueChange,
}: {
  value: T;
  optionKeys: readonly T[];
  labels: Record<T, string>;
  onValueChange: (v: T) => void;
}) {
  const TriggerIcon = SOURCE_SORT_ICONS[value as SourceSort] ?? ArrowUpDown;

  return (
    <div className="w-full min-w-0">
      <Select
        value={value}
        onValueChange={(v) => {
          if (!v) return;
          onValueChange(v as T);
        }}
      >
        <SelectTrigger size="sm" className={SOURCE_FILTER_SELECT_TRIGGER_CLASS}>
          <span
            className="inline-flex shrink-0 text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4"
            aria-hidden
          >
            <TriggerIcon />
          </span>
          <span
            data-slot="select-value"
            className="min-w-0 flex-1 truncate text-left"
          >
            {labels[value]}
          </span>
        </SelectTrigger>
        <SelectContent>
        {optionKeys.map((key) => {
          const RowIcon = SOURCE_SORT_ICONS[key as SourceSort] ?? ArrowUpDown;
          return (
            <SelectItem key={key} value={key}>
              <span className="flex min-w-0 items-center gap-2">
                <RowIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">{labels[key]}</span>
              </span>
            </SelectItem>
          );
        })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function NonSharedTypeFilterSelect({
  value,
  onValueChange,
}: {
  value: NonSharedTypeFilter;
  onValueChange: (v: NonSharedTypeFilter) => void;
}) {
  return (
    <div className="w-full min-w-0">
      <Select
        value={value}
        onValueChange={(v) => {
          if (!v) return;
          onValueChange(v as NonSharedTypeFilter);
        }}
      >
        <SelectTrigger
          size="sm"
          className={NON_SHARED_TYPE_FILTER_TRIGGER_CLASS}
        >
          <span
            className="inline-flex shrink-0 text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4"
            aria-hidden
          >
            {getNonSharedTypeFilterTriggerIcon(value, Layers)}
          </span>
          <span
            data-slot="select-value"
            className="min-w-0 flex-1 truncate text-left"
          >
            {value === "all" ? "Todos los tipos" : SOURCE_TYPE_LABELS[value]}
          </span>
        </SelectTrigger>
        <SelectContent>
        <SelectItem value="all">
          <span className="flex min-w-0 items-center gap-2">
            <Layers className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">Todos</span>
          </span>
        </SelectItem>
        {NON_SHARED_TYPES.map((t) => (
          <SelectItem key={t} value={t}>
            <span className="flex min-w-0 items-center gap-2">
              <SourceTypeIcon
                type={t}
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="min-w-0">{SOURCE_TYPE_LABELS[t]}</span>
            </span>
          </SelectItem>
        ))}
        </SelectContent>
      </Select>
    </div>
  );
}
