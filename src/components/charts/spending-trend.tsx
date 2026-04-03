"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartLineTooltipCursor,
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipWrapperStyle,
} from "@/components/charts/chart-theme";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import type { Expense } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface Props {
  expenses: Expense[];
}

export function SpendingTrend({ expenses }: Props) {
  const now = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(now),
    end: now > endOfMonth(now) ? endOfMonth(now) : now,
  });

  const data = days.map((day) => {
    const dayStart = day.getTime();
    const dayEnd = dayStart + 86_400_000 - 1;
    const amount = expenses
      .filter((e) => e.date >= dayStart && e.date <= dayEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      date: format(day, "dd", { locale: es }),
      amount: Math.round(amount * 100) / 100,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Tendencia Diaria (Mes Actual)</CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin datos para mostrar
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.45}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tickFormatter={(v) => `${CURRENCY_SYMBOL}${v}`}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <Tooltip
                contentStyle={chartTooltipContentStyle}
                labelStyle={chartTooltipLabelStyle}
                itemStyle={chartTooltipItemStyle}
                wrapperStyle={chartTooltipWrapperStyle}
                cursor={chartLineTooltipCursor}
                formatter={(value) => [
                  `${CURRENCY_SYMBOL} ${Number(value).toFixed(2)}`,
                  "Gasto",
                ]}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "var(--primary)",
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
