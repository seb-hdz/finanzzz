"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipWrapperStyle,
} from "@/components/charts/chart-theme";
import type { Expense, Tag } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface Props {
  expenses: Expense[];
  tags: Tag[];
}

export function SpendingByTag({ expenses, tags }: Props) {
  const tagMap = new Map(tags.map((t) => [t.id, t]));

  const totals = new Map<string, number>();
  expenses.forEach((e) => {
    if (e.tagIds.length === 0) {
      totals.set("__none__", (totals.get("__none__") ?? 0) + e.amount);
    } else {
      e.tagIds.forEach((id) => {
        totals.set(id, (totals.get(id) ?? 0) + e.amount);
      });
    }
  });

  const data = Array.from(totals.entries())
    .map(([id, amount]) => ({
      name: id === "__none__" ? "Sin tag" : (tagMap.get(id)?.name ?? "—"),
      amount,
      color: id === "__none__" ? "#737373" : (tagMap.get(id)?.color ?? "#737373"),
    }))
    .sort((a, b) => b.amount - a.amount);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Distribución por Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin datos para mostrar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Distribución por Tags</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTooltipContentStyle}
              labelStyle={chartTooltipLabelStyle}
              itemStyle={chartTooltipItemStyle}
              wrapperStyle={chartTooltipWrapperStyle}
              formatter={(value) => [`${CURRENCY_SYMBOL} ${Number(value).toFixed(2)}`, "Monto"]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ color: "var(--foreground)" }}
              labelStyle={{ color: "var(--foreground)" }}
              inactiveColor="var(--muted-foreground)"
              formatter={(value) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
