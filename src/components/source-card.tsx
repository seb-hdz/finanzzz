"use client";

import { Pencil, Trash2, Link2, AlertTriangle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SourceBadge } from "./source-badge";
import type { Source, Expense, GlobalConfig } from "@/lib/types";
import {
  formatPEN,
  LIMIT_INTERVAL_SPENT_LABELS,
  limitProgressIndicatorClassName,
  limitProgressTrackClassName,
} from "@/lib/limits";

interface SourceCardProps {
  source: Source;
  expenses: Expense[];
  config: GlobalConfig | undefined;
  onEdit: (source: Source) => void;
  onDelete: (source: Source) => void;
  /** Present for shared sources: sync UI on /sources */
  sharedMeta?: {
    linked: boolean;
    stale: boolean;
    /** Local expenses not yet sent in an outbound update (linked sources only). */
    pendingOutboundCount?: number;
    onOpenSync: () => void;
  };
}

export function SourceCard({
  source,
  expenses,
  config,
  onEdit,
  onDelete,
  sharedMeta,
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

  const spentLabel = config
    ? LIMIT_INTERVAL_SPENT_LABELS[config.limitInterval]
    : "Gastado";

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: source.color }}
      />
      <CardHeader className="flex flex-row items-start justify-between pb-2 pl-5">
        <div className="space-y-1">
          <CardTitle className="text-base">{source.name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge type={source.type} />
            {sharedMeta && !sharedMeta.linked && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Pendiente de vincular
              </span>
            )}
            {sharedMeta && sharedMeta.linked && sharedMeta.stale && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3" />
                Sync antigua
              </span>
            )}
            {sharedMeta &&
              sharedMeta.linked &&
              (sharedMeta.pendingOutboundCount ?? 0) > 0 && (
                <span
                  className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400"
                  title="Gastos que aún no van en una actualización enviada al otro dispositivo"
                >
                  <Upload className="size-3" />
                  {sharedMeta.pendingOutboundCount === 1
                    ? "1 sin enviar"
                    : `${sharedMeta.pendingOutboundCount} sin enviar`}
                </span>
              )}
          </div>
        </div>
        <div className="flex gap-1">
          {sharedMeta && (
            <Button
              variant="secondary"
              size="icon"
              className="size-8"
              title="Sincronizar"
              onClick={() => sharedMeta.onOpenSync()}
            >
              <Link2 className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEdit(source)}
          >
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
          <span className="text-muted-foreground">{spentLabel}</span>
          <span className="font-semibold">
            {formatPEN(spent)}
            {hasMax && (
              <span className="text-muted-foreground font-normal">
                {" "}
                / {formatPEN(source.maxLimit)}
              </span>
            )}
          </span>
        </div>
        {hasMax && (
          <Progress
            value={pct}
            trackClassName={limitProgressTrackClassName()}
            indicatorClassName={limitProgressIndicatorClassName(
              isDanger,
              isWarning
            )}
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
