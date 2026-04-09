"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipWrapperStyle,
} from "@/components/charts/chart-theme";
import type { Expense, Tag } from "@/lib/types";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { Separator } from "../ui/separator";

const NONE_BUCKET = "__none__";
const COLOR_NO_TAG = "#737373";
const LABEL_SIN_TAG = "Sin tag";
const LABEL_NO_SYNC = "No sincronizado";

/** Distinct from "Sin tag" for unknown tag ids (e.g. not yet synced). */
const COLOR_UNSYNCED = "#b45309";

/** Resto por monto desc; al final siempre "No sincronizado" y "Sin tag" (en ese orden). */
function orderTagSlicesForDisplay(rows: TagSlice[]): TagSlice[] {
  const sinTag = rows.find((d) => d.name === LABEL_SIN_TAG);
  const noSync = rows.find((d) => d.name === LABEL_NO_SYNC);
  const rest = rows.filter(
    (d) => d.name !== LABEL_SIN_TAG && d.name !== LABEL_NO_SYNC
  );
  rest.sort((a, b) => b.amount - a.amount);
  return [...rest, ...(noSync ? [noSync] : []), ...(sinTag ? [sinTag] : [])];
}

interface Props {
  expenses: Expense[];
  tags: Tag[];
}

type TagSlice = { name: string; amount: number; color: string };

type PieTooltipRow = {
  name?: string | number;
  value?: unknown;
  payload?: TagSlice;
};

function numericFromTooltipValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  if (Array.isArray(value) && value.length > 0) {
    return numericFromTooltipValue(value[0], fallback);
  }
  return fallback;
}

function TagPieTooltip({
  active,
  payload,
  totalAmount,
}: {
  active?: boolean;
  payload?: readonly PieTooltipRow[];
  totalAmount: number;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const name = String(row.name ?? row.payload?.name ?? "");
  const amount = numericFromTooltipValue(row.value, row.payload?.amount ?? 0);
  const pct =
    totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : "0.0";

  return (
    <div
      key={name}
      className="tag-pie-tooltip-panel"
      style={chartTooltipContentStyle}
    >
      <div style={chartTooltipLabelStyle}>{name}</div>
      <Separator className="mt-1 mb-2" />
      <div className="text-xs text-muted-foreground">{pct}% del total</div>
      <div style={{ ...chartTooltipItemStyle, paddingTop: 6 }}>
        {`${CURRENCY_SYMBOL} ${amount.toFixed(2)}`}
      </div>
    </div>
  );
}

export function SpendingByTag({ expenses, tags }: Props) {
  const tagMap = new Map(tags.map((t) => [t.id, t]));

  const totals = new Map<string, number>();
  expenses.forEach((e) => {
    if (e.tagIds.length === 0) {
      totals.set(NONE_BUCKET, (totals.get(NONE_BUCKET) ?? 0) + e.amount);
    } else {
      e.tagIds.forEach((id) => {
        totals.set(id, (totals.get(id) ?? 0) + e.amount);
      });
    }
  });

  let unsyncedTotal = 0;
  const data: TagSlice[] = [];
  for (const [id, amount] of totals) {
    if (id === NONE_BUCKET) {
      data.push({ name: LABEL_SIN_TAG, amount, color: COLOR_NO_TAG });
    } else {
      const tag = tagMap.get(id);
      if (tag) {
        data.push({ name: tag.name, amount, color: tag.color });
      } else {
        unsyncedTotal += amount;
      }
    }
  }
  if (unsyncedTotal > 0) {
    data.push({
      name: LABEL_NO_SYNC,
      amount: unsyncedTotal,
      color: COLOR_UNSYNCED,
    });
  }
  const dataOrdered = orderTagSlicesForDisplay(data);
  const totalAmount = dataOrdered.reduce((s, d) => s + d.amount, 0);

  if (dataOrdered.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Distribución por Tags
          </CardTitle>
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
        <CardTitle className="text-sm font-medium">
          Distribución por Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="h-[250px] w-full min-h-0 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataOrdered}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={2}
                stroke="none"
              >
                {dataOrdered.map((entry, i) => (
                  <Cell key={`${entry.name}-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                isAnimationActive={false}
                wrapperStyle={chartTooltipWrapperStyle}
                content={({ active, payload }) => (
                  <TagPieTooltip
                    active={active}
                    payload={payload as readonly PieTooltipRow[] | undefined}
                    totalAmount={totalAmount}
                  />
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul
          className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5"
          aria-label="Leyenda de tags"
        >
          {dataOrdered.map((entry, i) => (
            <li
              key={`${entry.name}-${i}`}
              className="flex items-center gap-1.5 text-xs text-foreground"
            >
              <span
                className="size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span>{entry.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
