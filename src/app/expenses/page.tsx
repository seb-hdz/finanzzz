"use client";

import { useMemo, useState } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
import {
  useSources,
  useTags,
  useExpensesByDateRange,
  deleteExpense,
} from "@/lib/db-hooks";
import { formatPEN } from "@/lib/limits";
import type { Expense, SourceType } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/types";

type SourceTypeFilter = "all" | SourceType;

const SOURCE_TYPES: SourceType[] = [
  "bank_account",
  "mobile_payment",
  "debit_card",
  "credit_card",
  "shared",
];

type Period = "daily" | "weekly" | "monthly";

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
  }
}

export default function ExpensesPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sourceTypeFilter, setSourceTypeFilter] =
    useState<SourceTypeFilter>("all");
  const [tagFilter, setTagFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [deleting, setDeleting] = useState<Expense | undefined>();

  const range = useMemo(() => getRange(period), [period]);
  const expenses = useExpensesByDateRange(range.start, range.end);
  const sources = useSources();
  const tags = useTags();

  const filtered = useMemo(() => {
    let result = expenses;
    if (sourceFilter !== "all") {
      result = result.filter((e) => e.sourceId === sourceFilter);
    }
    if (sourceTypeFilter !== "all") {
      const ids = new Set(
        sources.filter((s) => s.type === sourceTypeFilter).map((s) => s.id)
      );
      result = result.filter((e) => ids.has(e.sourceId));
    }
    if (tagFilter !== "all") {
      result = result.filter((e) => e.tagIds.includes(tagFilter));
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
  }, [expenses, sourceFilter, sourceTypeFilter, tagFilter, search, sources]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

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
      <div className="flex items-start justify-between">
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
          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v ?? "all")}
          >
            <SelectTrigger
              className="h-auto min-h-9 w-full min-w-0 md:flex-1"
              title={
                sourceFilter !== "all"
                  ? sources.find((s) => s.id === sourceFilter)?.name
                  : undefined
              }
            >
              <span data-slot="select-value" className="truncate">
                {sourceFilter === "all"
                  ? "Todas las fuentes"
                  : sources.find((s) => s.id === sourceFilter)?.name ??
                    "Fuente"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fuentes</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-start gap-2">
                    <div
                      className="size-2 rounded-full block"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sourceTypeFilter}
            onValueChange={(v) =>
              setSourceTypeFilter((v ?? "all") as SourceTypeFilter)
            }
          >
            <SelectTrigger className="h-auto min-h-9 w-full min-w-0 md:flex-1">
              <span data-slot="select-value" className="truncate">
                {sourceTypeFilter === "all"
                  ? "Todos los tipos"
                  : SOURCE_TYPE_LABELS[sourceTypeFilter]}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {SOURCE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {SOURCE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={tagFilter}
            onValueChange={(v) => setTagFilter(v ?? "all")}
          >
            <SelectTrigger
              className="h-auto min-h-9 w-full min-w-0 md:flex-1"
              title={
                tagFilter !== "all"
                  ? tags.find((t) => t.id === tagFilter)?.name
                  : undefined
              }
            >
              <span data-slot="select-value" className="truncate">
                {tagFilter === "all"
                  ? "Todos los tags"
                  : tags.find((t) => t.id === tagFilter)?.name ?? "Tag"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ExpenseList
        expenses={filtered}
        sources={sources}
        tags={tags}
        onEdit={handleEdit}
        onDelete={setDeleting}
      />

      <ExpenseForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editing}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el gasto de {deleting && formatPEN(deleting.amount)}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
