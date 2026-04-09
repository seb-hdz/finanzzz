"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import {
  Link2,
  Copy,
  Loader2,
  Send,
  Download,
  AlertTriangle,
  QrCodeIcon,
  Share2,
  Images,
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
} from "@/lib/shared-sync";
import { svgElementToPngFile } from "@/lib/qr-share-image";
import {
  SharedSyncReceivePanel,
  type SharedSyncReceivePanelHandle,
} from "@/components/shared-sync-receive-panel";
import { formatPEN } from "@/lib/limits";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useIsStandalone } from "@/lib/use-standalone";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";

/** SVG fill colors for QR (hex: `react-qr-code` / scanners handle these reliably). */
const QR_FG_LIGHT_UI = "#171717";
const QR_BG_LIGHT_UI = "#ffffff";
const QR_FG_DARK_UI = "#fafafa";
const QR_BG_DARK_UI = "#1a1a1a";

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
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const [tab, setTab] = useState<SyncTab>("send");
  const [url, setUrl] = useState("");
  const [sentToken, setSentToken] = useState("");
  const [included, setIncluded] = useState<{ id: string; label: string }[]>([]);
  const [sending, setSending] = useState(false);

  const [showQR, setShowQR] = useState(false);
  const [receiveNonce, setReceiveNonce] = useState(0);
  const [recvBusy, setRecvBusy] = useState(false);
  /** Evita que el diálogo enfoque el input readOnly del id (primer tabbable). */
  const dialogInitialFocusRef = useRef<HTMLButtonElement>(null);
  const receiveRef = useRef<SharedSyncReceivePanelHandle>(null);
  const qrExportRef = useRef<HTMLDivElement>(null);

  function resetState() {
    setUrl("");
    setSentToken("");
    setIncluded([]);
    setShowQR(false);
  }

  useEffect(() => {
    if (tab !== "send") setShowQR(false);
  }, [tab]);

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

      const canAsyncClipboardWrite =
        typeof ClipboardItem !== "undefined" &&
        typeof navigator.clipboard?.write === "function";

      if (canAsyncClipboardWrite) {
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
      }

      const { token, includedExpenses, urlTooLong } = await resultPromise;
      const fullUrl = buildFullSyncUrl(token);

      if (!canAsyncClipboardWrite) {
        if (urlTooLong || !token) {
          throw new Error(
            "El enlace sigue siendo muy largo. Prueba de nuevo tras sincronizar por partes."
          );
        }
        await navigator.clipboard.writeText(fullUrl);
      }

      await recordSuccessfulSharedEmission(
        source.id,
        includedExpenses.map((e) => e.id)
      );
      setUrl(fullUrl);
      setSentToken(token);
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

  async function shareSyncUrl() {
    if (!url) return;
    if (typeof navigator.share !== "function") {
      toast.error("Compartir no está disponible en este navegador.");
      return;
    }
    try {
      await navigator.share({
        title: "Sincronización Finanzzz",
        text: "Enlace para sincronizar la cuenta compartida",
        url,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error(
        e instanceof Error ? e.message : "No se pudo abrir el menú de compartir."
      );
    }
  }

  async function shareQrPng() {
    if (!sentToken) return;
    const root = qrExportRef.current;
    const svg = root?.querySelector("svg");
    if (!svg) {
      toast.error("No se encontró el código QR.");
      return;
    }
    try {
      const file = await svgElementToPngFile(
        svg as SVGSVGElement,
        "finanzzz-sync-qr.png"
      );
      const payload = { files: [file] };
      if (typeof navigator.share !== "function") {
        toast.error("Compartir no está disponible en este navegador.");
        return;
      }
      if (!navigator.canShare?.(payload)) {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Imagen del QR descargada");
        return;
      }
      await navigator.share({
        files: [file],
        title: "Código QR de sincronización",
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast.error(
        e instanceof Error ? e.message : "No se pudo compartir el QR."
      );
    }
  }

  if (!source || source.type !== "shared") {
    return null;
  }

  const widenForQr = showQR && Boolean(sentToken);

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(o) => {
        if (!o) resetState();
        onOpenChange(o);
      }}
    >
      <DialogContent
        initialFocus={dialogInitialFocusRef}
        className={cn(
          "max-h-[90vh] overflow-y-auto transition-[max-width] duration-300 ease-in-out",
          widenForQr ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
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
                ref={dialogInitialFocusRef}
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
                onClick={() => {
                  setTab("receive");
                  setReceiveNonce((n) => n + 1);
                }}
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
                    <div className="flex flex-wrap gap-2">
                      <Input
                        readOnly
                        value={url}
                        className="min-w-0 flex-1 font-mono text-xs basis-[min(100%,12rem)]"
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
                        aria-label="Copiar URL"
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => void shareSyncUrl()}
                        aria-label="Compartir enlace"
                      >
                        <Share2 className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => setShowQR((v) => !v)}
                        disabled={!sentToken}
                        aria-pressed={showQR}
                        aria-label={
                          showQR ? "Ocultar código QR" : "Mostrar código QR"
                        }
                      >
                        <QrCodeIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={!sentToken}
                        onClick={() => void shareQrPng()}
                        aria-label="Compartir código QR como imagen"
                      >
                        <Images className="size-4" />
                      </Button>
                    </div>

                    {sentToken ? (
                      <div
                        className="pointer-events-none fixed -left-[2000px] top-0 opacity-0"
                        aria-hidden
                      >
                        <div ref={qrExportRef}>
                          <QRCode
                            value={sentToken}
                            size={512}
                            fgColor={
                              isDarkMode ? QR_FG_DARK_UI : QR_FG_LIGHT_UI
                            }
                            bgColor={
                              isDarkMode ? QR_BG_DARK_UI : QR_BG_LIGHT_UI
                            }
                          />
                        </div>
                      </div>
                    ) : null}

                    {sentToken ? (
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-300 ease-in-out",
                          showQR ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        )}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="flex justify-center border-t px-4 py-4">
                            <QRCode
                              value={sentToken}
                              size={200}
                              className="h-auto max-w-full"
                              fgColor={
                                isDarkMode ? QR_FG_DARK_UI : QR_FG_LIGHT_UI
                              }
                              bgColor={
                                isDarkMode ? QR_BG_DARK_UI : QR_BG_LIGHT_UI
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}

            {/* ── Receive tab ── */}
            {tab === "receive" && source && (
              <SharedSyncReceivePanel
                key={receiveNonce}
                ref={receiveRef}
                variant="modal"
                sourceId={source.id}
                showSubmitButton={false}
                onReceivingChange={setRecvBusy}
                onSuccess={() => {
                  onOpenChange(false);
                  resetState();
                  router.refresh();
                }}
              />
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
                  "Generar URL de sincronización"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full"
                onClick={() => receiveRef.current?.submit()}
                disabled={recvBusy}
              >
                {recvBusy ? (
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
