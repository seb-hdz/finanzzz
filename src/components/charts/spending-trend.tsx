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
import type { TooltipPayload } from "recharts";
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
import { formatPEN } from "@/lib/limits";
import { Separator } from "../ui/separator";

type TrendPoint = {
  date: string;
  dateLabel: string;
  amount: number;
  cumulative: number;
};

function SpendingTrendTooltip({
  active,
  payload,
  globalLimit,
}: {
  active?: boolean;
  payload?: TooltipPayload;
  globalLimit: number | undefined;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as TrendPoint | undefined;
  if (!row) return null;

  const showConsumed = globalLimit !== undefined && globalLimit > 0;
  const consumedPct = showConsumed
    ? Math.round((row.cumulative / globalLimit) * 100)
    : null;

  return (
    <div
      style={{
        ...chartTooltipContentStyle,
        whiteSpace: "normal",
      }}
    >
      <p style={chartTooltipLabelStyle}>{row.dateLabel}</p>
      <Separator className="mt-2 mb-3" />
      <div style={{ ...chartTooltipItemStyle, paddingTop: 0 }}>
        <p> Gasto: {formatPEN(row.amount)}</p>
        {consumedPct !== null ? <p>Consumido: {consumedPct}%</p> : null}
      </div>
    </div>
  );
}

interface Props {
  expenses: Expense[];
  /** Límite global (S/). Si es positivo, el tooltip muestra el % acumulado del mes respecto al límite. */
  globalLimit?: number;
}

export function SpendingTrend({ expenses, globalLimit }: Props) {
  const now = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(now),
    end: now > endOfMonth(now) ? endOfMonth(now) : now,
  });

  const data: TrendPoint[] = days.reduce((acc, day) => {
    const dayStart = day.getTime();
    const dayEnd = dayStart + 86_400_000 - 1;
    const amount = expenses
      .filter((e) => e.date >= dayStart && e.date <= dayEnd)
      .reduce((sum, e) => sum + e.amount, 0);
    const rounded = Math.round(amount * 100) / 100;
    const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    const cumulative = Math.round((prevCumulative + rounded) * 100) / 100;

    acc.push({
      date: format(day, "dd", { locale: es }),
      dateLabel: format(day, "dd 'de' MMMM", { locale: es }),
      amount: rounded,
      cumulative,
    });
    return acc;
  }, [] as TrendPoint[]);

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Tendencia Diaria (Mes Actual)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {expenses.length === 0 ? (
          <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground py-8">
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
                content={({ active, payload }) => (
                  <SpendingTrendTooltip
                    active={active}
                    payload={payload}
                    globalLimit={globalLimit}
                  />
                )}
                wrapperStyle={chartTooltipWrapperStyle}
                cursor={chartLineTooltipCursor}
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
