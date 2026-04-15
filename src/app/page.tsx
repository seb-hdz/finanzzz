"use client";

import { useMemo, useState } from "react";
import { LimitIntervalSelect } from "@/components/limit-interval-select";
import {
  HomeDashboard,
  HomeDashboardEditToggle,
} from "@/components/home-dashboard";
import { HomeQuickActionButton } from "@/components/home-quick-action-button";
import { HomeQuickActionPlaceholder } from "@/components/home-quick-action-placeholder";
import {
  useSources,
  useTags,
  useExpensesInInterval,
  useGlobalConfig,
} from "@/lib/db-hooks";
import {
  HOME_QUICK_ACTION_CONFIG_NONE,
  resolveHomeQuickActionConfigId,
} from "@/lib/home-quick-action-paths";
import type { LimitInterval } from "@/lib/types";

export default function DashboardPage() {
  const config = useGlobalConfig();
  const [viewInterval, setViewInterval] = useState<LimitInterval | undefined>(
    undefined
  );
  const [dashboardEditMode, setDashboardEditMode] = useState(false);
  const interval = viewInterval ?? config?.limitInterval ?? "monthly";
  const expenses = useExpensesInInterval(interval);
  const sources = useSources();
  const tags = useTags();

  const homeQuickActionConfigId = resolveHomeQuickActionConfigId(
    config?.homeQuickActionId
  );

  const stats = useMemo(() => {
    const count = expenses.length;
    const sum = expenses.reduce((s, e) => s + e.amount, 0);
    const avgPerExpense = count > 0 ? sum / count : 0;

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

    return { count, avgPerExpense, topSource, topAmount };
  }, [expenses, sources]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>
            <HomeDashboardEditToggle
              pressed={dashboardEditMode}
              onPressedChange={setDashboardEditMode}
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {config?.homeQuickActionEnabled !== false &&
              (homeQuickActionConfigId === HOME_QUICK_ACTION_CONFIG_NONE ? (
                <HomeQuickActionPlaceholder />
              ) : (
                <HomeQuickActionButton actionId={homeQuickActionConfigId} />
              ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-0 [@media(min-width:374px)]:-mt-2">
          <span>Resumen de gastos</span>
          <LimitIntervalSelect
            variant="inline"
            value={interval}
            onValueChange={(v) => setViewInterval(v)}
          />
        </p>
      </div>

      <HomeDashboard
        editMode={dashboardEditMode}
        expenses={expenses}
        sources={sources}
        tags={tags}
        config={config}
        stats={stats}
      />
    </div>
  );
}
