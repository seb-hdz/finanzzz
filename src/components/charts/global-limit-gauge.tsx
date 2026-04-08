"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GlobalConfig, Expense } from "@/lib/types";
import {
  formatPEN,
  limitProgressIndicatorClassName,
  limitProgressTrackClassName,
} from "@/lib/limits";

interface Props {
  expenses: Expense[];
  config: GlobalConfig | undefined;
}

export function GlobalLimitGauge({ expenses, config }: Props) {
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const limit = config?.totalMaxLimit ?? -1;
  const hasLimit = limit > 0;
  const pct = hasLimit ? Math.min((spent / limit) * 100, 100) : 0;

  const isDanger =
    hasLimit && config && spent / limit >= config.dangerThreshold;
  const isWarning =
    hasLimit && config && spent / limit >= config.warningThreshold;

  return (
    <Card className="h-full min-h-0 lg:flex lg:flex-col">
      <CardHeader className="pb-2 lg:pb-3">
        <CardTitle className="text-sm font-medium lg:text-base">
          Gastos globales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-bold lg:text-4xl">
            {formatPEN(spent)}
          </span>
          {hasLimit && (
            <span className="text-sm text-muted-foreground lg:text-base">
              de {formatPEN(limit)}
            </span>
          )}
        </div>
        {hasLimit ? (
          <>
            <Progress
              value={pct}
              trackClassName={limitProgressTrackClassName()}
              indicatorClassName={limitProgressIndicatorClassName(
                isDanger,
                isWarning
              )}
            />
            <p className="text-xs text-muted-foreground lg:text-sm">
              {Math.round(pct)}% utilizado &middot;{" "}
              {spent < limit
                ? `Restante: ${formatPEN(limit - spent)}`
                : `Excedido por ${formatPEN(spent - limit)}`}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground lg:text-sm">
            Sin límite global configurado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
