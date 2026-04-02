"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { SourceCard } from "@/components/source-card";
import { SourceForm } from "@/components/source-form";
import {
  useSources,
  useExpensesInInterval,
  useGlobalConfig,
  deleteSource,
} from "@/lib/db-hooks";
import type { Source } from "@/lib/types";

export default function SourcesPage() {
  const sources = useSources();
  const config = useGlobalConfig();
  const expenses = useExpensesInInterval(config?.limitInterval ?? "monthly");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Source | undefined>();
  const [deleting, setDeleting] = useState<Source | undefined>();

  function handleEdit(source: Source) {
    setEditing(source);
    setFormOpen(true);
  }

  function handleNew() {
    setEditing(undefined);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteSource(deleting.id);
      toast.success("Fuente eliminada");
    } catch (err) {
      toast.error((err as Error).message);
    }
    setDeleting(undefined);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuentes de Pago</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus cuentas, tarjetas y métodos de pago
          </p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="size-4 mr-1" />
          Nueva
        </Button>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay fuentes de pago configuradas.</p>
          <Button variant="outline" className="mt-4" onClick={handleNew}>
            Crear primera fuente
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              expenses={expenses}
              config={config}
              onEdit={handleEdit}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <SourceForm
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        source={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar fuente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{deleting?.name}&quot;. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
