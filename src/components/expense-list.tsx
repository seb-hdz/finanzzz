"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Expense, Source, Tag } from "@/lib/types";
import { formatPEN } from "@/lib/limits";

function ClampedText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setClamped(el.scrollHeight > el.clientHeight + 1);
  }, []);

  useEffect(() => {
    check();
    const ro = new ResizeObserver(check);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [check]);

  return (
    <div>
      <p
        ref={expanded ? undefined : ref}
        className={cn(
          "min-w-0 wrap-break-word text-sm font-medium",
          !expanded && "line-clamp-2"
        )}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          className="mt-0.5 text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "ver menos" : "ver más"}
        </button>
      )}
    </div>
  );
}

interface ExpenseListProps {
  expenses: Expense[];
  sources: Source[];
  tags: Tag[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

export function ExpenseList({
  expenses,
  sources,
  tags,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const tagMap = new Map(tags.map((t) => [t.id, t]));

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay gastos para mostrar.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => {
        const source = sourceMap.get(expense.sourceId);
        const expenseTags = expense.tagIds
          .map((id) => tagMap.get(id))
          .filter(Boolean);

        return (
          <div
            key={expense.id}
            className="flex min-w-0 items-start gap-3 overflow-hidden rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
          >
            {source && (
              <div
                className="size-2.5 shrink-0 rounded-full mt-1.5"
                style={{ backgroundColor: source.color }}
              />
            )}
            <div className="min-w-0 flex-1">
              <ClampedText text={expense.description || "Sin descripción"} />
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {format(expense.date, "dd MMM yyyy", { locale: es })}
                </span>{" "}
                &middot;
                {source && (
                  <span className="min-w-0 max-w-full truncate text-xs text-muted-foreground">
                    {source.name}
                  </span>
                )}
                {expenseTags.map((tag) => (
                  <Badge
                    key={tag!.id}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 text-white"
                    style={{ backgroundColor: tag!.color }}
                  >
                    {tag!.name}
                  </Badge>
                ))}
              </div>
            </div>
            <span className="font-semibold text-sm whitespace-nowrap">
              {formatPEN(expense.amount)}
            </span>
            {onEdit && onDelete ? (
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => onEdit(expense)}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive"
                  onClick={() => onDelete(expense)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
