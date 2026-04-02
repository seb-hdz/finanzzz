"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GlobalConfig, Expense } from "@/lib/types";
import { formatPEN } from "@/lib/limits";

interface Props {
  expenses: Expense[];
  config: GlobalConfig | undefined;
}

export function GlobalLimitGauge({ expenses, config }: Props) {
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const limit = config?.totalMaxLimit ?? -1;
  const hasLimit = limit > 0;
  const pct = hasLimit ? Math.min((spent / limit) * 100, 100) : 0;

  const isDanger = hasLimit && config && spent / limit >= config.dangerThreshold;
  const isWarning = hasLimit && config && spent / limit >= config.warningThreshold;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Límite Global</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold">{formatPEN(spent)}</span>
          {hasLimit && (
            <span className="text-sm text-muted-foreground">
              de {formatPEN(limit)}
            </span>
          )}
        </div>
        {hasLimit ? (
          <>
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
            <p className="text-xs text-muted-foreground">
              {Math.round(pct)}% utilizado &middot;{" "}
              {spent < limit
                ? `Restante: ${formatPEN(limit - spent)}`
                : `Excedido por ${formatPEN(spent - limit)}`}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sin límite global configurado
          </p>
        )}
      </CardContent>
    </Card>
  );
}
