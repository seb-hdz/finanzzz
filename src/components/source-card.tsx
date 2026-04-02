"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SourceBadge } from "./source-badge";
import type { Source, Expense, GlobalConfig } from "@/lib/types";
import { formatPEN } from "@/lib/limits";

interface SourceCardProps {
  source: Source;
  expenses: Expense[];
  config: GlobalConfig | undefined;
  onEdit: (source: Source) => void;
  onDelete: (source: Source) => void;
}

export function SourceCard({
  source,
  expenses,
  config,
  onEdit,
  onDelete,
}: SourceCardProps) {
  const spent = expenses
    .filter((e) => e.sourceId === source.id)
    .reduce((s, e) => s + e.amount, 0);

  const hasMax = source.maxLimit > 0;
  const pct = hasMax ? Math.min((spent / source.maxLimit) * 100, 100) : 0;

  const isDanger =
    hasMax && config && spent / source.maxLimit >= config.dangerThreshold;
  const isWarning =
    hasMax && config && spent / source.maxLimit >= config.warningThreshold;

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: source.color }}
      />
      <CardHeader className="flex flex-row items-start justify-between pb-2 pl-5">
        <div className="space-y-1">
          <CardTitle className="text-base">{source.name}</CardTitle>
          <SourceBadge type={source.type} />
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(source)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            onClick={() => onDelete(source)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pl-5 space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Gastado</span>
          <span className="font-semibold">
            {formatPEN(spent)}
            {hasMax && (
              <span className="text-muted-foreground font-normal">
                {" "}/ {formatPEN(source.maxLimit)}
              </span>
            )}
          </span>
        </div>
        {hasMax && (
          <Progress
            value={pct}
            className={
              isDanger
                ? "[&>div]:bg-red-500"
                : isWarning
                  ? "[&>div]:bg-yellow-500"
                  : "[&>div]:bg-green-500"
            }
          />
        )}
        {source.minLimit > 0 && (
          <p className="text-xs text-muted-foreground">
            Mínimo: {formatPEN(source.minLimit)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
