"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useSources,
  useTags,
  useGlobalConfig,
  addExpense,
  updateExpense,
  useSharedSyncState,
  isSharedSourceLinked,
} from "@/lib/db-hooks";
import {
  computeSpentInInterval,
  evaluateAlert,
  getAlertMessage,
} from "@/lib/limits";
import { db } from "@/lib/db";
import type { Expense } from "@/lib/types";
import Link from "next/link";

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
}

export function ExpenseForm({ open, onOpenChange, expense }: ExpenseFormProps) {
  const sources = useSources();
  const tags = useTags();
  const config = useGlobalConfig();

  const [amount, setAmount] = useState(
    expense ? expense.amount.toFixed(2) : ""
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [sourceId, setSourceId] = useState(expense?.sourceId ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    expense?.tagIds ?? []
  );
  const [date, setDate] = useState<Date>(
    expense ? new Date(expense.date) : new Date()
  );

  const sharedSync = useSharedSyncState(sourceId || undefined);

  const isEditing = !!expense;

  const selectedSource = sources.find((s) => s.id === sourceId);
  const sharedBlocked =
    !isEditing &&
    selectedSource?.type === "shared" &&
    !isSharedSourceLinked(sharedSync ?? undefined);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !sourceId) return;
    if (sharedBlocked) {
      toast.error(
        "Vincula la fuente compartida (envía y recibe una actualización) antes de registrar gastos."
      );
      return;
    }

    const data = {
      amount: parsedAmount,
      description: description.trim(),
      sourceId,
      tagIds: selectedTags,
      date: date.getTime(),
    };

    if (isEditing) {
      await updateExpense(expense.id, data);
      toast.success("Gasto actualizado");
    } else {
      await addExpense(data);
      await showAlerts(sourceId);
    }

    onOpenChange(false);
    if (!isEditing) {
      setAmount("");
      setDescription("");
      setSelectedTags([]);
    }
  }

  async function showAlerts(sid: string) {
    if (!config) return;

    const allExpenses = await db.expenses.toArray();
    const source = sources.find((s) => s.id === sid);

    if (source && source.maxLimit > 0) {
      const spent = computeSpentInInterval(
        allExpenses,
        config.limitInterval,
        sid
      );
      const level = evaluateAlert(spent, source.maxLimit, config);
      const msg = getAlertMessage(level, spent, source.maxLimit);
      if (level === "danger")
        toast.error(`${source.name}`, { description: msg });
      else if (level === "warning")
        toast.warning(`${source.name}`, { description: msg });
      else toast.success(source.name, { description: msg });
    }

    if (config.totalMaxLimit > 0) {
      const totalSpent = computeSpentInInterval(
        allExpenses,
        config.limitInterval
      );
      const globalLevel = evaluateAlert(
        totalSpent,
        config.totalMaxLimit,
        config
      );
      const globalMsg = getAlertMessage(
        globalLevel,
        totalSpent,
        config.totalMaxLimit
      );
      if (globalLevel === "danger")
        toast.error(`Global`, { description: globalMsg });
      else if (globalLevel === "warning")
        toast.warning(`Global`, { description: globalMsg });
    }

    if (!source || source.maxLimit <= 0) {
      if (config.totalMaxLimit <= 0) {
        if (source) {
          toast.success(source.name, { description: "Gasto registrado" });
        } else {
          toast.success("Gasto registrado");
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Gasto" : "Nuevo Gasto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto (S/)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => {
                const n = parseFloat(amount);
                if (!Number.isNaN(n) && n > 0) setAmount(n.toFixed(2));
              }}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="¿En qué gastaste?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Fuente de pago</Label>
            <Select
              value={sourceId}
              onValueChange={(v) => v && setSourceId(v)}
              disabled={sources.length === 0}
            >
              <SelectTrigger
                className="w-full min-w-0"
                title={
                  sourceId
                    ? sources.find((s) => s.id === sourceId)?.name
                    : undefined
                }
              >
                <span
                  data-slot="select-value"
                  className={cn(
                    "min-w-0 flex-1 text-left",
                    !sourceId && "text-muted-foreground"
                  )}
                >
                  {sourceId
                    ? sources.find((s) => s.id === sourceId)?.name ?? "Fuente"
                    : "Seleccionar fuente"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="min-w-0 break-words">{s.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sources.length === 0 && (
              <p className="text-xs text-destructive">
                Primero crea una fuente de pago en la sección{" "}
                <Link href="/sources" className="underline">
                  Fuentes
                </Link>
                .
              </p>
            )}
            {sharedBlocked && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Esta fuente compartida aún no está vinculada en este
                dispositivo. Ve a{" "}
                <Link href="/sources" className="underline">
                  Fuentes
                </Link>{" "}
                → Fuentes compartidas, sincroniza con la otra persona y vuelve
                aquí.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 size-4" />
                {date
                  ? format(date, "PPP", { locale: es })
                  : "Seleccionar fecha"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={
                    selectedTags.includes(tag.id) ? "default" : "outline"
                  }
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedTags.includes(tag.id) && "text-white"
                  )}
                  style={
                    selectedTags.includes(tag.id)
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : {}
                  }
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={sources.length === 0 || sharedBlocked}
            >
              {isEditing ? "Guardar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
