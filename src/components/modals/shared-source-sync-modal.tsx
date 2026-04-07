"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  Loader2,
  Send,
  Download,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import type { Source } from "@/lib/types";
import { useSharedSyncState } from "@/lib/db-hooks";
import {
  buildFullSyncUrl,
  buildSharedSyncToken,
  recordSuccessfulSharedEmission,
  applySharedSyncFromToken,
  extractTokenFromInput,
} from "@/lib/shared-sync";
import { formatPEN } from "@/lib/limits";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useIsStandalone } from "@/lib/use-standalone";
import { cn } from "@/lib/utils";

type SyncTab = "send" | "receive";

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
  const router = useRouter();
  const sync = useSharedSyncState(source?.id);
  const isStandalone = useIsStandalone();

  const [tab, setTab] = useState<SyncTab>("send");
  const [url, setUrl] = useState("");
  const [included, setIncluded] = useState<{ id: string; label: string }[]>([]);
  const [sending, setSending] = useState(false);

  const [pastedInput, setPastedInput] = useState("");
  const [receivePassword, setReceivePassword] = useState("");
  const [showReceivePassword, setShowReceivePassword] = useState(false);
  const [receiveRemember, setReceiveRemember] = useState(true);
  const [receiving, setReceiving] = useState(false);

  function resetState() {
    setUrl("");
    setIncluded([]);
    setPastedInput("");
    setReceivePassword("");
    setShowReceivePassword(false);
    setReceiveRemember(true);
  }

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

  async function handleReceive() {
    const token = extractTokenFromInput(pastedInput);
    if (!token) {
      toast.error("Pega la URL recibida.");
      return;
    }

    const pw = receivePassword || sync?.storedInboundPassword;
    if (!pw) {
      toast.error("Introduce la contraseña de enlace.");
      return;
    }

    setReceiving(true);
    try {
      const result = await applySharedSyncFromToken({
        token,
        password: pw,
        rememberPassword: receiveRemember,
      });
      if (result.ok) {
        toast.success(
          result.mergedCount > 0
            ? `Sincronizado: ${result.mergedCount} actualización(es).`
            : "Sincronizado (sin gastos nuevos en este enlace)."
        );
        onOpenChange(false);
        resetState();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al sincronizar.");
    } finally {
      setReceiving(false);
    }
  }

  if (!source || source.type !== "shared") {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetState();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form
          className="contents"
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Sincronizar fuente compartida</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Estás sincronizando:{" "}
                <span className="text-foreground">{source.name}</span>
              </p>
              <Separator />
              <div className="space-y-1.5">
                <Label
                  htmlFor="shared-source-sync-public-id"
                  className="text-muted-foreground font-normal"
                >
                  Id compartido
                </Label>
                <Input
                  id="shared-source-sync-public-id"
                  readOnly
                  value={source.sharedPublicId ?? ""}
                  className="font-mono text-xs bg-muted/50"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Tab toggle */}
            <div className="flex rounded-lg border p-0.5">
              <button
                type="button"
                onClick={() => setTab("send")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === "send"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Send className="size-3.5" />
                Enviar
              </button>
              <button
                type="button"
                onClick={() => setTab("receive")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === "receive"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Download className="size-3.5" />
                Recibir
              </button>
            </div>

            {/* ── Send tab ── */}
            {tab === "send" && (
              <>
                <p className="text-muted-foreground">
                  El otro usuario debe conocer la contraseña e introducirla al
                  sincronizar.
                </p>

                {isStandalone && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span>
                      Estás usando la app instalada. Si el otro usuario también
                      la usa, deberá pegar el enlace usando{" "}
                      <strong>&quot;Recibir&quot;</strong> en lugar de abrirlo
                      en el navegador.
                    </span>
                  </div>
                )}

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
                      <Input
                        readOnly
                        value={url}
                        className="font-mono text-xs"
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore
                        data-bwignore
                      />
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
              </>
            )}

            {/* ── Receive tab ── */}
            {tab === "receive" && (
              <>
                {isStandalone && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span>
                      Usa esta opción para sincronizar dentro de la app
                      instalada sin necesidad de abrir URLs en el navegador.
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="paste-token">URL</Label>
                  <Input
                    id="paste-token"
                    placeholder="Pega aquí la URL"
                    value={pastedInput}
                    onChange={(e) => setPastedInput(e.target.value)}
                    className="font-mono text-xs"
                    autoComplete="off"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-lpignore="true"
                    data-1p-ignore
                    data-bwignore
                  />
                  <p className="text-muted-foreground">
                    Pega la URL que te envió la otra persona para sincronizar.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receive-pw">Contraseña de enlace</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="receive-pw"
                      type={showReceivePassword ? "text" : "password"}
                      value={receivePassword}
                      onChange={(e) => setReceivePassword(e.target.value)}
                      placeholder={
                        sync?.storedInboundPassword
                          ? "Vacía para usar la guardada"
                          : "Introduce la contraseña de la URL"
                      }
                      autoComplete="off"
                      className="min-w-0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowReceivePassword((v) => !v)}
                      aria-label={
                        showReceivePassword
                          ? "Ocultar contraseña de enlace"
                          : "Mostrar contraseña de enlace"
                      }
                    >
                      {showReceivePassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    checked={receiveRemember}
                    onChange={(e) => setReceiveRemember(e.target.checked)}
                  />
                  Recordar contraseña en este dispositivo
                </label>
              </>
            )}
          </div>

          <DialogFooter>
            {tab === "send" ? (
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
            ) : (
              <Button
                type="button"
                className="w-full"
                onClick={handleReceive}
                disabled={receiving || !pastedInput.trim()}
              >
                {receiving ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Aplicando…
                  </>
                ) : (
                  "Confirmar y sincronizar"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
