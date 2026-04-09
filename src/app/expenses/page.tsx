"use client";

import { useMemo, useState } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Landmark, Layers, Plus, Search, Tag } from "lucide-react";
import {
  getSourceTypeMultiSelectTriggerIcon,
  SourceTypeIcon,
} from "@/components/source-type-icon";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelectDropdown } from "@/components/multi-select-dropdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExpenseList } from "@/components/expense-list";
import { ExpenseForm } from "@/components/expense-form";
import { SourceBadge } from "@/components/source-badge";
import {
  useSources,
  useTags,
  useExpensesByDateRange,
  deleteExpense,
} from "@/lib/db-hooks";
import { formatPEN } from "@/lib/limits";
import { PAYMENT_SOURCE_SECTIONS } from "@/lib/payment-source-sections";
import type { Expense, SourceType } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/types";

const SOURCE_TYPES: SourceType[] = [
  "bank_account",
  "mobile_payment",
  "debit_card",
  "credit_card",
  "shared",
];

type Period = "daily" | "weekly" | "monthly" | "yearly";

function getRange(period: Period) {
  const now = new Date();
  switch (period) {
    case "daily":
      return { start: startOfDay(now).getTime(), end: endOfDay(now).getTime() };
    case "weekly":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }).getTime(),
        end: endOfWeek(now, { weekStartsOn: 1 }).getTime(),
      };
    case "monthly":
      return {
        start: startOfMonth(now).getTime(),
        end: endOfMonth(now).getTime(),
      };
    case "yearly":
      return {
        start: startOfYear(now).getTime(),
        end: endOfYear(now).getTime(),
      };
  }
}

export default function ExpensesPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [search, setSearch] = useState("");
  const [sourceFilterIds, setSourceFilterIds] = useState<string[]>([]);
  const [sourceTypeFilterIds, setSourceTypeFilterIds] = useState<string[]>([]);
  const [tagFilterIds, setTagFilterIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [deleting, setDeleting] = useState<Expense | undefined>();

  const range = useMemo(() => getRange(period), [period]);
  const expenses = useExpensesByDateRange(range.start, range.end);
  const sources = useSources();
  const tags = useTags();

  const sourceOptions = useMemo(
    () =>
      sources.map((s) => ({
        value: s.id,
        text: s.name,
        label: s.name,
        swatchColor: s.color,
      })),
    [sources]
  );

  const sourceOptionGroups = useMemo(
    () =>
      PAYMENT_SOURCE_SECTIONS.map((section) => ({
        label: section.label,
        options: sources
          .filter((s) => section.types.includes(s.type))
          .map((s) => ({
            value: s.id,
            text: s.name,
            label: s.name,
            swatchColor: s.color,
          })),
      })).filter((g) => g.options.length > 0),
    [sources]
  );

  const typeOptions = useMemo(
    () =>
      SOURCE_TYPES.map((t) => ({
        value: t,
        text: SOURCE_TYPE_LABELS[t],
        label: (
          <span className="flex min-w-0 items-center gap-2">
            <SourceTypeIcon
              type={t}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="min-w-0">{SOURCE_TYPE_LABELS[t]}</span>
          </span>
        ),
      })),
    []
  );

  const tagOptions = useMemo(
    () =>
      tags.map((t) => ({
        value: t.id,
        text: t.name,
        label: t.name,
        swatchColor: t.color,
      })),
    [tags]
  );

  const filtered = useMemo(() => {
    let result = expenses;
    if (sourceFilterIds.length > 0) {
      const ids = new Set(sourceFilterIds);
      result = result.filter((e) => ids.has(e.sourceId));
    }
    if (sourceTypeFilterIds.length > 0) {
      const types = new Set(sourceTypeFilterIds);
      const ids = new Set(
        sources.filter((s) => types.has(s.type)).map((s) => s.id)
      );
      result = result.filter((e) => ids.has(e.sourceId));
    }
    if (tagFilterIds.length > 0) {
      const tagSet = new Set(tagFilterIds);
      result = result.filter((e) => e.tagIds.some((id) => tagSet.has(id)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.amount.toString().includes(q)
      );
    }
    return result;
  }, [
    expenses,
    sourceFilterIds,
    sourceTypeFilterIds,
    tagFilterIds,
    search,
    sources,
  ]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const deletingSource = useMemo(() => {
    return sources.find((s) => s.id === deleting?.sourceId);
  }, [deleting, sources]);

  function handleNew() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function handleEdit(expense: Expense) {
    setEditing(expense);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteExpense(deleting.id);
    toast.success("Gasto eliminado");
    setDeleting(undefined);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} gasto{filtered.length !== 1 && "s"} &middot;{" "}
            {formatPEN(total)}
          </p>
        </div>
        <Button className="mt-2 md:mt-0" onClick={handleNew} size="sm">
          <Plus className="size-4 mr-1" />
          Nuevo
        </Button>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="daily" className="flex-1 sm:flex-none">
            Hoy
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1 sm:flex-none">
            Semana
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1 sm:flex-none">
            Mes
          </TabsTrigger>
          <TabsTrigger value="yearly" className="flex-1 sm:flex-none">
            Año
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Buscar por descripción o monto..."
            className="w-full pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
          <MultiSelectDropdown
            className="md:flex-1"
            emptyLabel="Todas las fuentes"
            listLabel="Filtrar por fuente"
            options={sourceOptions}
            optionGroups={sourceOptionGroups}
            value={sourceFilterIds}
            onValueChange={setSourceFilterIds}
            triggerIcon={<Landmark />}
          />
          <MultiSelectDropdown
            className="md:flex-1"
            emptyLabel="Todos los tipos"
            listLabel="Filtrar por tipo de fuente"
            options={typeOptions}
            value={sourceTypeFilterIds}
            onValueChange={setSourceTypeFilterIds}
            triggerIcon={getSourceTypeMultiSelectTriggerIcon(
              sourceTypeFilterIds,
              Layers
            )}
          />
          <MultiSelectDropdown
            className="md:flex-1"
            emptyLabel="Todos los tags"
            listLabel="Filtrar por tag"
            options={tagOptions}
            value={tagFilterIds}
            onValueChange={setTagFilterIds}
            triggerIcon={<Tag />}
          />
        </div>
      </div>

      <ExpenseList
        expenses={filtered}
        sources={sources}
        tags={tags}
        onEdit={handleEdit}
      />

      <ExpenseForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editing}
        onDeleteRequest={setDeleting}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(undefined)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el gasto mostrado. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleting && (
            <div
              className="space-y-3 rounded-lg border bg-muted/40 p-3 text-left text-foreground"
              aria-label="Resumen del gasto a eliminar"
            >
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Monto
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight">
                  {formatPEN(deleting.amount)}
                </p>
              </div>
              {!!deleting.description.trim().length ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Descripción
                  </p>
                  <p className="mt-0.5 text-sm font-medium wrap-break-word">
                    {deleting.description}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Fuente
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {deletingSource ? (
                    <>
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: deletingSource.color }}
                        aria-hidden
                      />
                      <span className="min-w-0 text-sm font-medium">
                        {deletingSource.name}
                      </span>
                      <SourceBadge type={deletingSource.type} />
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Fuente no encontrada (pudo haberse eliminado)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
