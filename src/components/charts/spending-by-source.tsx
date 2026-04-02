"use client";

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
import type { Expense, Source } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";

interface Props {
  expenses: Expense[];
  sources: Source[];
}

export function SpendingBySource({ expenses, sources }: Props) {
  const data = sources
    .map((s) => ({
      name: s.name,
      amount: expenses
        .filter((e) => e.sourceId === s.id)
        .reduce((sum, e) => sum + e.amount, 0),
      color: s.color,
    }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Gasto por Fuente</CardTitle>
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
        <CardTitle className="text-sm font-medium">Gasto por Fuente</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              tickFormatter={(v) => `${CURRENCY_SYMBOL}${v}`}
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${CURRENCY_SYMBOL} ${Number(value).toFixed(2)}`, "Monto"]}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
