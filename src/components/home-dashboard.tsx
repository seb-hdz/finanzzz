"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Eye,
  EyeOff,
  GripHorizontal,
  GripVertical,
  Pencil,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlobalLimitGauge } from "@/components/charts/global-limit-gauge";
import { SpendingBySource } from "@/components/charts/spending-by-source";
import { SpendingByTag } from "@/components/charts/spending-by-tag";
import { SpendingTrend } from "@/components/charts/spending-trend";
import { formatPEN } from "@/lib/limits";
import {
  HOME_DASHBOARD_ROW_IDS,
  type HomeDashboardLayoutV1,
  type HomeDashboardRowId,
  type HomeDashboardWidgetId,
  defaultHomeDashboardLayout,
  findRowForWidget,
  readHomeDashboardLayout,
  writeHomeDashboardLayout,
} from "@/lib/home-dashboard-layout";
import { cn } from "@/lib/utils";
import type { Expense, GlobalConfig, Source, Tag } from "@/lib/types";

export type HomeDashboardStats = {
  count: number;
  avgPerExpense: number;
  topSource: Source | undefined;
  topAmount: number;
};

function isRowId(id: string): id is HomeDashboardRowId {
  return (HOME_DASHBOARD_ROW_IDS as string[]).includes(id);
}

function isWidgetId(id: string): id is HomeDashboardWidgetId {
  return (
    id === "globalGauge" ||
    id === "transactions" ||
    id === "topSource" ||
    id === "activeSources" ||
    id === "spendingBySource" ||
    id === "spendingByTag" ||
    id === "spendingTrend"
  );
}

function SortableRowShell({
  rowId,
  editMode,
  children,
}: {
  rowId: HomeDashboardRowId;
  editMode: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-xl",
        isDragging && "z-2 shadow-md ring-2 ring-primary/25"
      )}
    >
      {editMode ? (
        <div className="pointer-events-none absolute top-0.5 left-1/2 z-10 -translate-x-1/2 lg:left-3 lg:translate-x-0">
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            className="pointer-events-auto size-9 rounded-full shadow-sm"
            aria-label="Arrastrar bloque de fila"
            {...attributes}
            {...listeners}
          >
            <GripHorizontal className="size-4" />
          </Button>
        </div>
      ) : null}
      <div className={cn("min-h-0", editMode && "pt-6")}>{children}</div>
    </div>
  );
}

function SortableWidgetShell({
  id,
  editMode,
  hidden,
  onToggleHidden,
  children,
}: {
  id: HomeDashboardWidgetId;
  editMode: boolean;
  hidden: boolean;
  onToggleHidden: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 3 : undefined,
  };

  const showContent = editMode || !hidden;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex h-auto min-h-0 flex-col self-stretch lg:h-full",
        !showContent && "hidden",
        hidden && editMode && "opacity-[0.38]",
        !hidden && editMode && "opacity-[0.72]",
        isDragging && "z-3 ring-2 ring-primary/30 rounded-xl"
      )}
    >
      {editMode ? (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            className="size-7 rounded-full shadow-sm"
            aria-label={hidden ? "Mostrar tarjeta" : "Ocultar tarjeta"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleHidden();
            }}
          >
            {hidden ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon-xs"
            className="size-7 touch-none rounded-full shadow-sm"
            aria-label="Arrastrar tarjeta"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-3.5" />
          </Button>
        </div>
      ) : null}
      {showContent ? (
        <div
          className={cn(
            "flex min-h-0 flex-col max-lg:h-auto max-lg:flex-none lg:h-full lg:flex-1",
            editMode && "ring-1 ring-border/60 rounded-xl"
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function HomeDashboardEditToggle({
  pressed,
  onPressedChange,
}: {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant={pressed ? "secondary" : "outline"}
      className="size-6 shrink-0 rounded-full"
      aria-pressed={pressed}
      aria-label={pressed ? "Terminar edición" : "Editar orden de las tarjetas"}
      onClick={() => onPressedChange(!pressed)}
    >
      {pressed ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <Pencil className="size-3" aria-hidden />
      )}
    </Button>
  );
}

export function HomeDashboard({
  editMode,
  expenses,
  sources,
  tags,
  config,
  stats,
}: {
  editMode: boolean;
  expenses: Expense[];
  sources: Source[];
  tags: Tag[];
  config: GlobalConfig | undefined;
  stats: HomeDashboardStats;
}) {
  const [layout, setLayout] = useState<HomeDashboardLayoutV1>(
    defaultHomeDashboardLayout
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setLayout(readHomeDashboardLayout());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeHomeDashboardLayout(layout);
  }, [layout, hydrated]);

  const hiddenSet = useMemo(() => new Set(layout.hidden), [layout.hidden]);

  const toggleHidden = useCallback((id: HomeDashboardWidgetId) => {
    setLayout((prev) => {
      const hidden = [...prev.hidden];
      const i = hidden.indexOf(id);
      if (i >= 0) hidden.splice(i, 1);
      else hidden.push(id);
      return { ...prev, hidden };
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (isRowId(activeId)) {
      if (!isRowId(overId)) return;
      setLayout((prev) => {
        const oldIndex = prev.rowOrder.indexOf(activeId);
        const newIndex = prev.rowOrder.indexOf(overId);
        if (oldIndex < 0 || newIndex < 0) return prev;
        return {
          ...prev,
          rowOrder: arrayMove(prev.rowOrder, oldIndex, newIndex),
        };
      });
      return;
    }

    if (!isWidgetId(activeId) || !isWidgetId(overId)) return;

    setLayout((prev) => {
      const rowA = findRowForWidget(prev, activeId);
      const rowO = findRowForWidget(prev, overId);
      if (!rowA || rowA !== rowO) return prev;
      const items = [...prev.itemsByRow[rowA]];
      const from = items.indexOf(activeId);
      const to = items.indexOf(overId);
      if (from < 0 || to < 0) return prev;
      return {
        ...prev,
        itemsByRow: {
          ...prev.itemsByRow,
          [rowA]: arrayMove(items, from, to),
        },
      };
    });
  }, []);

  const renderWidget = (id: HomeDashboardWidgetId) => {
    switch (id) {
      case "globalGauge":
        return (
          <div className="min-h-0 h-full lg:min-h-0">
            <GlobalLimitGauge expenses={expenses} config={config} />
          </div>
        );
      case "transactions":
        return (
          <Card className="flex h-full min-h-0 flex-col lg:min-h-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Transacciones
              </CardTitle>
              <Receipt className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center">
              <div className="text-3xl font-bold">{stats.count}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: {formatPEN(stats.avgPerExpense)}
              </p>
            </CardContent>
          </Card>
        );
      case "topSource":
        return (
          <Card className="flex h-full min-h-0 flex-col lg:min-h-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2 lg:pb-3">
              <CardTitle className="text-sm font-medium lg:text-base">
                Top cuenta
              </CardTitle>
              <Wallet className="size-4 text-muted-foreground lg:size-5" />
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center">
              <div className="text-lg font-bold truncate lg:text-2xl">
                {stats.topSource?.name ?? "—"}
              </div>
              <p className="text-xs text-muted-foreground lg:text-sm">
                {stats.topAmount > 0
                  ? formatPEN(stats.topAmount)
                  : "Sin gastos"}
              </p>
            </CardContent>
          </Card>
        );
      case "activeSources":
        return (
          <Card className="flex h-full min-h-0 flex-col lg:min-h-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Cuentas activas
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
        );
      case "spendingBySource":
        return <SpendingBySource expenses={expenses} sources={sources} />;
      case "spendingByTag":
        return <SpendingByTag expenses={expenses} tags={tags} />;
      case "spendingTrend":
        return (
          <SpendingTrend
            expenses={expenses}
            globalLimit={
              config && config.totalMaxLimit > 0
                ? config.totalMaxLimit
                : undefined
            }
          />
        );
      default:
        return null;
    }
  };

  const rowInner = (rowId: HomeDashboardRowId) => {
    const ids = layout.itemsByRow[rowId];

    return (
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        {rowId === "metrics" ? (
          <div className="flex min-h-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto] lg:items-stretch">
            {ids.map((wid) => (
              <SortableWidgetShell
                key={wid}
                id={wid}
                editMode={editMode}
                hidden={hiddenSet.has(wid)}
                onToggleHidden={() => toggleHidden(wid)}
              >
                {renderWidget(wid)}
              </SortableWidgetShell>
            ))}
          </div>
        ) : null}
        {rowId === "charts" ? (
          <div className="grid min-h-0 gap-4 max-lg:items-start lg:grid-cols-2 lg:items-stretch">
            {ids.map((wid) => (
              <SortableWidgetShell
                key={wid}
                id={wid}
                editMode={editMode}
                hidden={hiddenSet.has(wid)}
                onToggleHidden={() => toggleHidden(wid)}
              >
                {renderWidget(wid)}
              </SortableWidgetShell>
            ))}
          </div>
        ) : null}
        {rowId === "trend" ? (
          <div className="min-h-0 min-w-0">
            {ids.map((wid) => (
              <SortableWidgetShell
                key={wid}
                id={wid}
                editMode={editMode}
                hidden={hiddenSet.has(wid)}
                onToggleHidden={() => toggleHidden(wid)}
              >
                {renderWidget(wid)}
              </SortableWidgetShell>
            ))}
          </div>
        ) : null}
      </SortableContext>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={layout.rowOrder}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-6">
          {layout.rowOrder.map((rowId) => (
            <SortableRowShell key={rowId} rowId={rowId} editMode={editMode}>
              {rowInner(rowId)}
            </SortableRowShell>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
