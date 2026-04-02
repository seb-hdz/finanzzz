import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Expense, Source, Tag } from "./types";
import { CURRENCY_SYMBOL } from "./constants";

interface ReportData {
  expenses: Expense[];
  sources: Source[];
  tags: Tag[];
  startDate: number;
  endDate: number;
  title?: string;
}

export function generateExpenseReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const { expenses, sources, tags, startDate, endDate, title } = data;

  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const tagMap = new Map(tags.map((t) => [t.id, t]));

  const rangeLabel = `${format(startDate, "dd MMM yyyy", { locale: es })} - ${format(endDate, "dd MMM yyyy", { locale: es })}`;
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  doc.setFontSize(18);
  doc.text(title || "Reporte de Gastos - Finanzzz", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Período: ${rangeLabel}`, 14, 32);
  doc.text(`Total: ${CURRENCY_SYMBOL} ${total.toFixed(2)}`, 14, 39);
  doc.text(`Gastos registrados: ${expenses.length}`, 14, 46);

  const tableData = expenses
    .sort((a, b) => a.date - b.date)
    .map((e) => [
      format(e.date, "dd/MM/yyyy"),
      e.description,
      sourceMap.get(e.sourceId)?.name ?? "—",
      e.tagIds.map((id) => tagMap.get(id)?.name ?? "").filter(Boolean).join(", ") || "—",
      `${CURRENCY_SYMBOL} ${e.amount.toFixed(2)}`,
    ]);

  autoTable(doc, {
    startY: 54,
    head: [["Fecha", "Descripción", "Fuente", "Tags", "Monto"]],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 30, 30] },
    columnStyles: {
      4: { halign: "right" },
    },
  });

  const bySource = new Map<string, number>();
  expenses.forEach((e) => {
    bySource.set(e.sourceId, (bySource.get(e.sourceId) ?? 0) + e.amount);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 80;
  let y = finalY + 14;

  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text("Resumen por Fuente", 14, y);
  y += 8;

  const summaryData = Array.from(bySource.entries()).map(([sourceId, amount]) => [
    sourceMap.get(sourceId)?.name ?? "—",
    `${CURRENCY_SYMBOL} ${amount.toFixed(2)}`,
    total > 0 ? `${((amount / total) * 100).toFixed(1)}%` : "0%",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Fuente", "Monto", "% del Total"]],
    body: summaryData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 30, 30] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Finanzzz - Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return doc;
}
