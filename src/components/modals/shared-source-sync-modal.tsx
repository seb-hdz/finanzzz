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
  Eye,
  EyeOff,
  QrCodeIcon,
  KeyRound,
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
import { useTheme } from "@/providers/theme-provider";
import type { IScannerControls } from "@zxing/browser";

/** SVG fill colors for QR (hex: `react-qr-code` / scanners handle these reliably). */
const QR_FG_LIGHT_UI = "#171717";
const QR_BG_LIGHT_UI = "#ffffff";
const QR_FG_DARK_UI = "#fafafa";
const QR_BG_DARK_UI = "#1a1a1a";

type SyncTab = "send" | "receive";

/** Heuristic: sync tokens are base64url and long enough to distinguish from random QR text. */
function isPlausibleSharedSyncToken(token: string): boolean {
  const t = token.trim();
  if (t.length < 32) return false;
  return /^[A-Za-z0-9_-]+$/.test(t);
}

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

  const [pastedInput, setPastedInput] = useState("");
  const [receivePassword, setReceivePassword] = useState("");
  const [showReceivePassword, setShowReceivePassword] = useState(false);
  const [receiveRemember, setReceiveRemember] = useState(true);
  const [inboundPwOverride, setInboundPwOverride] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  /** Evita que el diálogo enfoque el input readOnly del id (primer tabbable). */
  const dialogInitialFocusRef = useRef<HTMLButtonElement>(null);

  function resetState() {
    setUrl("");
    setSentToken("");
    setIncluded([]);
    setPastedInput("");
    setReceivePassword("");
    setShowReceivePassword(false);
    setReceiveRemember(true);
    setInboundPwOverride(false);
    setScannerOpen(false);
    setShowQR(false);
  }

  useEffect(() => {
    if (!open) setScannerOpen(false);
  }, [open]);

  useEffect(() => {
    if (tab !== "send") setShowQR(false);
  }, [tab]);

  useEffect(() => {
    if (tab !== "receive") setScannerOpen(false);
  }, [tab]);

  useEffect(() => {
    if (!scannerOpen || !open) {
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    (async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result, _err, ctrl) => {
            if (cancelled || !result) return;
            const text = result.getText().trim();
            const token = extractTokenFromInput(text);
            if (!isPlausibleSharedSyncToken(token)) return;
            setPastedInput(text);
            ctrl.stop();
            scannerControlsRef.current = null;
            setScannerOpen(false);
            toast.success("Enlace capturado desde el código QR");
          }
        );
        if (cancelled) {
          controls.stop();
        } else {
          scannerControlsRef.current = controls;
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof Error
              ? e.message
              : "No se pudo usar la cámara para escanear."
          );
          setScannerOpen(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
    };
  }, [scannerOpen, open]);

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
    const hasStored = Boolean(sync?.storedInboundPassword);
    const showPwFields = !hasStored || inboundPwOverride;
    try {
      const result = await applySharedSyncFromToken({
        token,
        password: pw,
        rememberPassword: showPwFields ? receiveRemember : true,
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
        if (hasStored && !inboundPwOverride && !receivePassword.trim()) {
          setInboundPwOverride(true);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al sincronizar.");
      if (hasStored && !inboundPwOverride && !receivePassword.trim()) {
        setInboundPwOverride(true);
      }
    } finally {
      setReceiving(false);
    }
  }

  if (!source || source.type !== "shared") {
    return null;
  }

  const widenForQr = showQR && Boolean(sentToken);
  const hasStoredInboundPw = Boolean(sync?.storedInboundPassword);
  const showReceivePwSection = !hasStoredInboundPw || inboundPwOverride;

  return (
    <Dialog
      open={open}
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
                    </div>

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
            {tab === "receive" && (
              <>
                {isStandalone && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span>
                      Usa esta opción para sincronizar desde la app instalada
                      sin necesidad de abrir URLs en el navegador.
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="paste-token">URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="paste-token"
                      placeholder="Pega aquí la URL"
                      value={pastedInput}
                      onChange={(e) => setPastedInput(e.target.value)}
                      className="min-w-0 flex-1 font-mono text-xs"
                      autoComplete="off"
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      data-lpignore="true"
                      data-1p-ignore
                      data-bwignore
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => setScannerOpen((v) => !v)}
                      aria-expanded={scannerOpen}
                      aria-controls="shared-sync-qr-scanner"
                      aria-label={
                        scannerOpen
                          ? "Cerrar escáner de código QR"
                          : "Escanear código QR con la cámara"
                      }
                    >
                      <QrCodeIcon className="size-4" />
                    </Button>
                  </div>
                  {scannerOpen ? (
                    <div
                      id="shared-sync-qr-scanner"
                      className="space-y-2 rounded-md border p-3"
                    >
                      <video
                        ref={videoRef}
                        className="aspect-video w-full rounded-md bg-black object-cover"
                        muted
                        playsInline
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => setScannerOpen(false)}
                      >
                        Cancelar escaneo
                      </Button>
                    </div>
                  ) : null}
                  <p className="text-muted-foreground">
                    Pega la URL que te envió la otra persona para sincronizar.
                  </p>
                </div>

                {showReceivePwSection ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="receive-pw">Contraseña de enlace</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="receive-pw"
                          type={showReceivePassword ? "text" : "password"}
                          value={receivePassword}
                          onChange={(e) => setReceivePassword(e.target.value)}
                          placeholder={
                            hasStoredInboundPw
                              ? "Vacía para usar la guardada"
                              : "Introduce la contraseña de la URL"
                          }
                          autoComplete="off"
                          className="min-w-0 text-sm md:text-base"
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
                      Guardar contraseña en este dispositivo
                    </label>
                  </>
                ) : (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
                    <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p>Se usará la contraseña guardada.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setInboundPwOverride(true)}
                        className="font-medium text-white hover:text-white bg-amber-500 hover:bg-amber-500/80 border-none dark:bg-amber-700 dark:hover:bg-amber-700/80"
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                )}
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
                  "Generar URL de sincronización"
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
