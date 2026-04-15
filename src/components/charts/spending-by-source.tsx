"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartBarCursor,
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipWrapperStyle,
} from "@/components/charts/chart-theme";
import type { Expense, Source } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";

/** Viewport >= lg (Tailwind): más filas; por debajo, menos para que quepa en móvil. */
const MEDIA_LG_UP = "(min-width: 1024px)";
/** Evita barras demasiado finas y etiquetas superpuestas; el resto se agrupa en "Otras cuentas". */
const MAX_SOURCES_IN_CHART_LG = 10;
const MAX_SOURCES_IN_CHART_COMPACT = 5;
const OTHERS_LABEL = "Otras cuentas";
const OTHERS_COLOR = "#737373";
/** ~ancho del eje Y en px; el texto largo se trunca a una línea (nombre completo en hover). */
const Y_AXIS_WIDTH = 132;
const Y_TICK_MAX_CHARS = 24;

interface Props {
  expenses: Expense[];
  sources: Source[];
}

type ChartRow = { name: string; amount: number; color: string };

function ChartSourceYTick(props: {
  x?: string | number;
  y?: string | number;
  payload?: { value?: string };
}) {
  const { payload } = props;
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const raw = String(payload?.value ?? "");
  const label =
    raw.length > Y_TICK_MAX_CHARS
      ? `${raw.slice(0, Y_TICK_MAX_CHARS - 1)}…`
      : raw;

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{raw}</title>
      <text
        dx={-4}
        dy={3}
        textAnchor="end"
        fill="var(--muted-foreground)"
        fontSize={11}
      >
        {label}
      </text>
    </g>
  );
}

function buildChartData(rows: ChartRow[], maxShown: number): ChartRow[] {
  if (rows.length <= maxShown) return rows;
  const top = rows.slice(0, maxShown - 1);
  const restSum = rows.slice(maxShown - 1).reduce((s, d) => s + d.amount, 0);
  return [...top, { name: OTHERS_LABEL, amount: restSum, color: OTHERS_COLOR }];
}

export function SpendingBySource({ expenses, sources }: Props) {
  const [maxSources, setMaxSources] = useState(MAX_SOURCES_IN_CHART_LG);

  useEffect(() => {
    const mq = window.matchMedia(MEDIA_LG_UP);
    const apply = () =>
      setMaxSources(
        mq.matches ? MAX_SOURCES_IN_CHART_LG : MAX_SOURCES_IN_CHART_COMPACT
      );
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const rawData: ChartRow[] = sources
    .map((s) => ({
      name: s.name,
      amount: expenses
        .filter((e) => e.sourceId === s.id)
        .reduce((sum, e) => sum + e.amount, 0),
      color: s.color,
    }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalBySource = rawData.reduce((sum, r) => sum + r.amount, 0);

  const data = buildChartData(rawData, maxSources);

  if (rawData.length === 0) {
    return (
      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Gasto por cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center">
          <p className="text-center text-sm text-muted-foreground py-8">
            Sin datos para mostrar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Gasto por cuenta</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="w-full min-h-[250px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 20, right: 8, top: 6, bottom: 6 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.45}
              />
              <XAxis
                type="number"
                tickFormatter={(v) => `${CURRENCY_SYMBOL}${v}`}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={Y_AXIS_WIDTH}
                tick={ChartSourceYTick}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <Tooltip
                contentStyle={chartTooltipContentStyle}
                labelStyle={chartTooltipLabelStyle}
                itemStyle={chartTooltipItemStyle}
                wrapperStyle={chartTooltipWrapperStyle}
                cursor={chartBarCursor}
                labelFormatter={(_, payload) => {
                  const v = payload?.[0]?.value;
                  if (v === undefined || v === null) return "";
                  return `${CURRENCY_SYMBOL} ${Number(v).toFixed(2)}`;
                }}
                formatter={(value) => {
                  if (
                    totalBySource <= 0 ||
                    value === undefined ||
                    value === null
                  ) {
                    return null;
                  }
                  const pct = (Number(value) / totalBySource) * 100;
                  return [
                    `${pct.toLocaleString("es", {
                      maximumFractionDigits: 1,
                    })}% del gasto total`,
                    null,
                  ] as const;
                }}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
