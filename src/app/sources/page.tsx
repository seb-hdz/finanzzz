"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { SharedSourceSyncModal } from "@/components/shared-source-sync-modal";
import {
  useSources,
  useExpensesInInterval,
  useGlobalConfig,
  deleteSource,
  useSharedSyncState,
  useSharedSourcePendingOutboundCount,
  isSharedSourceLinked,
} from "@/lib/db-hooks";
import type { Source } from "@/lib/types";

function useNowMs(tickMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
}

function SharedSourceCardRow({
  source,
  expenses,
  config,
  onEdit,
  onDelete,
  onOpenSync,
}: {
  source: Source;
  expenses: Parameters<typeof SourceCard>[0]["expenses"];
  config: Parameters<typeof SourceCard>[0]["config"];
  onEdit: (s: Source) => void;
  onDelete: (s: Source) => void;
  onOpenSync: (s: Source) => void;
}) {
  const now = useNowMs(60_000);
  const sync = useSharedSyncState(source.id);
  const linked = isSharedSourceLinked(sync ?? undefined);
  const pendingOutboundCount = useSharedSourcePendingOutboundCount(
    source.id,
    linked
  );
  const staleHours = config?.sharedStaleHours ?? 168;
  const stale =
    linked &&
    !!sync?.lastReceivedRemoteAt &&
    now - sync.lastReceivedRemoteAt > staleHours * 3_600_000;

  return (
    <SourceCard
      source={source}
      expenses={expenses}
      config={config}
      onEdit={onEdit}
      onDelete={onDelete}
      sharedMeta={{
        linked,
        stale,
        pendingOutboundCount,
        onOpenSync: () => onOpenSync(source),
      }}
    />
  );
}

export default function SourcesPage() {
  const sources = useSources();
  const config = useGlobalConfig();
  const expenses = useExpensesInInterval(config?.limitInterval ?? "monthly");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Source | undefined>();
  const [deleting, setDeleting] = useState<Source | undefined>();
  const [syncSource, setSyncSource] = useState<Source | null>(null);

  const sharedSources = sources.filter((s) => s.type === "shared");
  const otherSources = sources.filter((s) => s.type !== "shared");

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
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuentes de Pago</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus cuentas, tarjetas y métodos de pago
          </p>
        </div>
        <Button className="mt-2 md:mt-0" onClick={handleNew} size="sm">
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
        <>
          {sharedSources.length > 0 && (
            <section className="space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Fuentes compartidas
                  </h2>
                  <Badge
                    variant="outline"
                    className="h-5 border-muted-foreground/35 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    BETA
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cuentas compartidas con el mismo id compartido en{" "}
                  <span className="underline">cada dispositivo</span>.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {sharedSources.map((source) => (
                  <SharedSourceCardRow
                    key={source.id}
                    source={source}
                    expenses={expenses}
                    config={config}
                    onEdit={handleEdit}
                    onDelete={setDeleting}
                    onOpenSync={setSyncSource}
                  />
                ))}
              </div>
            </section>
          )}

          {otherSources.length > 0 && (
            <section className="space-y-3">
              {sharedSources.length > 0 && (
                <h2 className="text-lg font-semibold tracking-tight">
                  Mis fuentes
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {otherSources.map((source) => (
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
            </section>
          )}
        </>
      )}

      <SourceForm
        key={`${editing?.id ?? "new"}-${formOpen}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        source={editing}
      />

      <SharedSourceSyncModal
        source={syncSource}
        open={!!syncSource}
        onOpenChange={(o) => {
          if (!o) setSyncSource(null);
        }}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={() => setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar fuente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{deleting?.name}&quot;. Esta acción no se puede
              deshacer.
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
