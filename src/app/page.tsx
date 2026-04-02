"use client";

import { useMemo } from "react";
import { TrendingUp, Receipt, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const INTERVAL_LABELS = {
  daily: "hoy",
  weekly: "esta semana",
  monthly: "este mes",
} as const;

export default function DashboardPage() {
  const config = useGlobalConfig();
  const interval = config?.limitInterval ?? "monthly";
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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de gastos {INTERVAL_LABELS[interval]}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlobalLimitGauge expenses={expenses} config={config} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.count}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatPEN(stats.avgPerExpense)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Fuente</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {stats.topSource?.name ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topAmount > 0 ? formatPEN(stats.topAmount) : "Sin gastos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fuentes Activas</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
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
