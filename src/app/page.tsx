"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Receipt, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LimitIntervalSelect } from "@/components/limit-interval-select";
import {
  useSources,
  useTags,
  useExpensesInInterval,
  useGlobalConfig,
} from "@/lib/db-hooks";
import { formatPEN } from "@/lib/limits";
import { GlobalLimitGauge } from "@/components/charts/global-limit-gauge";
import { SpendingBySource } from "@/components/charts/spending-by-source";
import { SpendingByTag } from "@/components/charts/spending-by-tag";
import { SpendingTrend } from "@/components/charts/spending-trend";
import type { LimitInterval } from "@/lib/types";

export default function DashboardPage() {
  const config = useGlobalConfig();
  const [viewInterval, setViewInterval] = useState<LimitInterval | undefined>(
    undefined
  );
  const interval =
    viewInterval ?? config?.limitInterval ?? "monthly";
  const expenses = useExpensesInInterval(interval);
  const sources = useSources();
  const tags = useTags();

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const count = expenses.length;
    const avgPerExpense = count > 0 ? total / count : 0;

    const bySource = new Map<string, number>();
    expenses.forEach((e) => {
      bySource.set(e.sourceId, (bySource.get(e.sourceId) ?? 0) + e.amount);
    });

    let topSourceId = "";
    let topAmount = 0;
    bySource.forEach((amount, id) => {
      if (amount > topAmount) {
        topAmount = amount;
        topSourceId = id;
      }
    });

    const topSource = sources.find((s) => s.id === topSourceId);

    return { total, count, avgPerExpense, topSource, topAmount };
  }, [expenses, sources]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
        <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <span>Resumen de gastos</span>
          <LimitIntervalSelect
            variant="inline"
            value={interval}
            onValueChange={(v) => setViewInterval(v)}
          />
        </p>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-2 lg:items-stretch">
        <div className="max-lg:order-1 lg:min-h-0 lg:h-full">
          <GlobalLimitGauge expenses={expenses} config={config} />
        </div>

        <Card className="flex h-full min-h-0 max-lg:order-3 flex-col lg:min-h-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center">
            <div className="text-3xl font-bold">{stats.count}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatPEN(stats.avgPerExpense)}
            </p>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-0 max-lg:order-2 flex-col lg:min-h-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2 lg:pb-3">
            <CardTitle className="text-sm font-medium lg:text-base">
              Top Fuente
            </CardTitle>
            <Wallet className="size-4 text-muted-foreground lg:size-5" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center">
            <div className="text-lg font-bold truncate lg:text-2xl">
              {stats.topSource?.name ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground lg:text-sm">
              {stats.topAmount > 0 ? formatPEN(stats.topAmount) : "Sin gastos"}
            </p>
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-0 max-lg:order-4 flex-col lg:min-h-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Fuentes Activas
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center">
            <div className="text-3xl font-bold">
              {new Set(expenses.map((e) => e.sourceId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              de {sources.length} configuradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendingBySource expenses={expenses} sources={sources} />
        <SpendingByTag expenses={expenses} tags={tags} />
      </div>

      <SpendingTrend expenses={expenses} />
    </div>
  );
}
