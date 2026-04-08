"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MultiSelectDropdownOption = {
  value: string;
  /** Plain text for the closed trigger when a single item is selected */
  text: string;
  /** Row content in the panel */
  label: React.ReactNode;
  swatchColor?: string;
};

function summaryLabel(
  options: MultiSelectDropdownOption[],
  value: readonly string[],
  emptyLabel: string
): string {
  if (value.length === 0) return emptyLabel;
  if (value.length === 1) {
    return options.find((o) => o.value === value[0])?.text ?? value[0];
  }
  return `${value.length} seleccionados`;
}

export type MultiSelectDropdownProps = {
  value: readonly string[];
  onValueChange: (next: string[]) => void;
  options: MultiSelectDropdownOption[];
  /** Label on the trigger when the selection is empty */
  emptyLabel: string;
  /** Accessible name for the options list */
  listLabel: string;
  /** Optional icon before the summary (e.g. filter affordance on small screens). */
  triggerIcon?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
};

export function MultiSelectDropdown({
  value,
  onValueChange,
  options,
  emptyLabel,
  listLabel,
  triggerIcon,
  className,
  contentClassName,
  align = "start",
}: MultiSelectDropdownProps) {
  const hasOptions = options.length > 0;
  const summary = summaryLabel(options, value, emptyLabel);
  const selected = React.useMemo(() => new Set(value), [value]);

  function toggle(v: string) {
    if (selected.has(v)) {
      onValueChange(value.filter((x) => x !== v));
    } else {
      onValueChange([...value, v]);
    }
  }

  const listId = React.useId();

  return (
    <Popover>
      <PopoverTrigger
        disabled={!hasOptions}
        className={cn(
          "flex h-auto min-h-9 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm font-normal transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-expanded:bg-muted/40 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-expanded:bg-input/50",
          className
        )}
        aria-controls={hasOptions ? listId : undefined}
      >
        {triggerIcon ? (
          <span
            className="inline-flex shrink-0 text-muted-foreground [&_svg]:pointer-events-none [&_svg]:size-4"
            aria-hidden
          >
            {triggerIcon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left">{summary}</span>
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "max-h-[min(18rem,var(--available-height,24rem))] w-(--anchor-width) min-w-36 gap-0 overflow-y-auto p-1",
          contentClassName
        )}
      >
        <div
          id={listId}
          role="listbox"
          aria-label={listLabel}
          aria-multiselectable="true"
          className="flex flex-col"
        >
          {options.map((opt) => {
            const isOn = selected.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isOn}
                className={cn(
                  "group flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none select-none transition-colors",
                  isOn
                    ? "bg-accent/60 text-accent-foreground"
                    : "hover:bg-muted/70"
                )}
                onClick={() => toggle(opt.value)}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border border-input bg-background shadow-none transition-shadow group-hover:shadow-sm group-focus-visible:shadow-sm dark:bg-input/30",
                    isOn &&
                      "border-primary bg-primary text-primary-foreground dark:bg-primary"
                  )}
                >
                  {isOn ? (
                    <CheckIcon className="size-3" strokeWidth={2.5} />
                  ) : null}
                </span>
                {opt.swatchColor ? (
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: opt.swatchColor }}
                    aria-hidden
                  />
                ) : null}
                <span className="min-w-0 flex-1 leading-snug wrap-break-word">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
