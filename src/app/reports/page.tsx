"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, FileDown, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Badge,
  tagBadgeResponsiveClassName,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ContextHint } from "@/components/ui/context-hint";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSources, useTags, useExpensesByDateRange } from "@/lib/db-hooks";
import { formatPEN } from "@/lib/limits";
import { generateExpenseReport } from "@/lib/pdf";
import { PAYMENT_SOURCE_SECTIONS } from "@/lib/payment-source-sections";
import { SourceTypeIcon } from "@/components/source-type-icon";
import { ExpenseList } from "@/components/expense-list";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set()
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const sources = useSources();
  const tags = useTags();

  const sourceSections = useMemo(
    () =>
      PAYMENT_SOURCE_SECTIONS.map((section) => ({
        label: section.label,
        sectionIconType: section.types[0],
        sources: sources.filter((s) => section.types.includes(s.type)),
      })).filter((s) => s.sources.length > 0),
    [sources]
  );

  const allExpenses = useExpensesByDateRange(
    startDate.getTime(),
    endDate.getTime()
  );

  const filtered = useMemo(() => {
    let result = allExpenses;
    if (selectedSources.size > 0) {
      result = result.filter((e) => selectedSources.has(e.sourceId));
    }
    if (selectedTags.size > 0) {
      result = result.filter((e) =>
        e.tagIds.some((id) => selectedTags.has(id))
      );
    }
    return result;
  }, [allExpenses, selectedSources, selectedTags]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  function toggleSource(id: string) {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExportPDF() {
    try {
      const doc = generateExpenseReport({
        expenses: filtered,
        sources,
        tags,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
      });
      doc.save(
        `finanzzz-reporte-${format(startDate, "yyyy-MM-dd")}_${format(
          endDate,
          "yyyy-MM-dd"
        )}.pdf`
      );
      toast.success("Reporte PDF generado");
    } catch {
      toast.error("Error al generar el PDF");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Genera y exporta reportes de tus gastos
          </p>
        </div>
        <Button
          className="mt-2 md:mt-0"
          onClick={handleExportPDF}
          size="sm"
          disabled={filtered.length === 0}
        >
          <FileDown className="size-4 mr-1" />
          Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configurar Reporte</CardTitle>
          <CardDescription>
            Selecciona el período y filtra por fuentes o tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-2" />
                  }
                >
                  <CalendarIcon className="size-3.5" />
                  {format(startDate, "dd/MM/yyyy")}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline" size="sm" className="gap-2" />
                  }
                >
                  <CalendarIcon className="size-3.5" />
                  {format(endDate, "dd/MM/yyyy")}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => d && setEndDate(d)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Label className="text-xs font-bold">Fuentes</Label>
              <ContextHint
                mode="popover"
                side="bottom"
                align="start"
                aria-label="Cómo filtrar por fuentes en el reporte"
                trigger={<Info className="size-3.5" />}
                triggerClassName="size-5"
                contentClassName="max-w-sm"
              >
                <p className="text-xs leading-snug">
                  Selecciona una o varias fuentes para el reporte. Se incluyen{" "}
                  <span className="font-medium">todas las fuentes</span> por
                  defecto.
                </p>
              </ContextHint>
            </div>

            {!!sources.length ? (
              <div className="space-y-3">
                {sourceSections.map(
                  ({ label, sectionIconType, sources: sectionSources }) => (
                    <div key={label} className="space-y-1.5">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <SourceTypeIcon
                          type={sectionIconType}
                          className="size-3.5 shrink-0 opacity-90"
                        />
                        {label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sectionSources.map((s) => {
                          const on = selectedSources.has(s.id);
                          return (
                            <Badge
                              key={s.id}
                              variant={on ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer border transition-colors",
                                on && "text-white"
                              )}
                              style={
                                on
                                  ? {
                                      backgroundColor: s.color,
                                      borderColor: s.color,
                                      color: "#fff",
                                    }
                                  : { borderColor: s.color }
                              }
                              onClick={() => toggleSource(s.id)}
                            >
                              {s.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs -mt-2 block text-center self-center">
                No hay fuentes configuradas.
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex flex-wrap items-start gap-1.5">
              <Label className="text-xs font-bold">Tags</Label>
              <ContextHint
                mode="popover"
                side="bottom"
                align="start"
                aria-label="Cómo filtrar por tags en el reporte"
                trigger={<Info className="size-3.5" />}
                triggerClassName="size-5"
                contentClassName="max-w-sm"
              >
                <p className="text-xs leading-snug">
                  Selecciona uno o varios tags para el reporte. Se incluyen{" "}
                  <span className="font-medium">todos los tags</span> por
                  defecto.
                </p>
              </ContextHint>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const on = selectedTags.has(t.id);
                return (
                  <Badge
                    key={t.id}
                    variant={on ? "default" : "outline"}
                    className={cn(
                      tagBadgeResponsiveClassName,
                      "cursor-pointer border transition-colors",
                      on && "text-white"
                    )}
                    style={
                      on
                        ? {
                            backgroundColor: t.color,
                            borderColor: t.color,
                            color: "#fff",
                          }
                        : { borderColor: t.color }
                    }
                    onClick={() => toggleTag(t.id)}
                  >
                    {t.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {filtered.length} gasto{filtered.length !== 1 && "s"} &middot; Total:{" "}
          <span className="font-semibold text-foreground">
            {formatPEN(total)}
          </span>
        </p>
      </div>

      <ExpenseList expenses={filtered} sources={sources} tags={tags} />
    </div>
  );
}
