"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Expense, Source, Tag } from "@/lib/types";
import { formatPEN } from "@/lib/limits";

interface ExpenseListProps {
  expenses: Expense[];
  sources: Source[];
  tags: Tag[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
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
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            {source && (
              <div
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: source.color }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm truncate">
                  {expense.description || "Sin descripción"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {format(expense.date, "dd MMM yyyy", { locale: es })}
                </span>
                {source && (
                  <span className="text-xs text-muted-foreground">
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
          </div>
        );
      })}
    </div>
  );
}
