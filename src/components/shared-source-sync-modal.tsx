"use client";

import { useState } from "react";
import { Link2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Source } from "@/lib/types";
import { useSharedSyncState } from "@/lib/db-hooks";
import {
  buildFullSyncUrl,
  buildSharedSyncToken,
  recordSuccessfulSharedEmission,
} from "@/lib/shared-sync";
import { formatPEN } from "@/lib/limits";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SharedSourceSyncModalProps {
  source: Source | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharedSourceSyncModal({
  source,
  open,
  onOpenChange,
}: SharedSourceSyncModalProps) {
  const sync = useSharedSyncState(source?.id);
  const [url, setUrl] = useState("");
  const [included, setIncluded] = useState<{ id: string; label: string }[]>([]);
  const [sending, setSending] = useState(false);

  async function handleSendUpdate() {
    if (!source || source.type !== "shared" || !sync?.outboundPassword) {
      toast.error("Define la contraseña de enlace editando la fuente.");
      return;
    }
    setSending(true);
    try {
      const resultPromise = buildSharedSyncToken(
        source,
        sync,
        sync.outboundPassword
      );

      // Register clipboard write synchronously with the user gesture so the
      // browser keeps transient activation while the async work resolves.
      const clipboardItem = new ClipboardItem({
        "text/plain": resultPromise.then(({ token, urlTooLong }) => {
          if (urlTooLong || !token)
            throw new Error(
              "El enlace sigue siendo muy largo. Prueba de nuevo tras sincronizar por partes."
            );
          return new Blob([buildFullSyncUrl(token)], { type: "text/plain" });
        }),
      });
      await navigator.clipboard.write([clipboardItem]);

      const { token, includedExpenses } = await resultPromise;
      const fullUrl = buildFullSyncUrl(token);

      await recordSuccessfulSharedEmission(
        source.id,
        includedExpenses.map((e) => e.id)
      );
      setUrl(fullUrl);
      setIncluded(
        includedExpenses.map((e) => ({
          id: e.id,
          label: `${formatPEN(e.amount)} · ${
            e.description || "Sin descripción"
          } · ${format(e.date, "d MMM yyyy", { locale: es })}`,
        }))
      );
      toast.success("URL copiada al portapapeles");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Error al generar el enlace"
      );
    } finally {
      setSending(false);
    }
  }

  async function copyAgain() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Copiado");
  }

  if (!source || source.type !== "shared") {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setUrl("");
          setIncluded([]);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sincronizar fuente compartida</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Estás sincronizando:{" "}
              <span className="text-foreground">{source.name}</span>
            </p>
            <p className="text-muted-foreground">
              Id compartido:{" "}
              <span className="font-mono text-foreground bg-muted rounded-md px-2 py-0.5">
                {source.sharedPublicId}
              </span>
            </p>
          </div>
          <p className="text-muted-foreground">
            El otro usuario debe conocer la contraseña e introducirla al abrir
            la URL para sincronizar.
          </p>

          {included.length > 0 && (
            <div className="space-y-1 rounded-md border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Gastos incluidos en este envío ({included.length})
              </p>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                {included.map((row) => (
                  <li key={row.id}>{row.label}</li>
                ))}
              </ul>
            </div>
          )}
          {url && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Link2 className="size-3.5" />
                URL de sincronización
              </Label>
              <div className="flex gap-2">
                <Input readOnly value={url} className="font-mono text-xs" />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={copyAgain}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            className="w-full"
            onClick={handleSendUpdate}
            disabled={sending || !sync?.outboundPassword}
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Generando…
              </>
            ) : (
              "Enviar actualización"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
