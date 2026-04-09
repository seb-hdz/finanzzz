"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
import { AlertTriangle, Eye, EyeOff, KeyRound, QrCodeIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSharedSyncState } from "@/lib/db-hooks";
import {
  applySharedSyncFromToken,
  extractTokenFromInput,
} from "@/lib/shared-sync";
import { useIsStandalone } from "@/lib/use-standalone";
import { cn } from "@/lib/utils";
import type { IScannerControls } from "@zxing/browser";

function isPlausibleSharedSyncToken(token: string): boolean {
  const t = token.trim();
  if (t.length < 32) return false;
  return /^[A-Za-z0-9_-]+$/.test(t);
}

export type SharedSyncReceivePanelHandle = {
  submit: () => void;
};

type SharedSyncReceivePanelProps = {
  variant: "page" | "modal";
  /** Required when variant is `modal`. */
  sourceId?: string;
  onSuccess: () => void;
  /** Modal footer uses this to disable the external submit control. */
  onReceivingChange?: (busy: boolean) => void;
  /** Seed the URL/token field (e.g. deep link `?d=`). */
  initialPastedInput?: string;
  /** Hide paste + camera row (password-only step). */
  hidePasteRow?: boolean;
  /** Renders the primary button inside the panel (default: page yes, modal no). */
  showSubmitButton?: boolean;
  className?: string;
};

export const SharedSyncReceivePanel = forwardRef<
  SharedSyncReceivePanelHandle,
  SharedSyncReceivePanelProps
>(function SharedSyncReceivePanelInner(
  {
    variant,
    sourceId,
    onSuccess,
    initialPastedInput = "",
    hidePasteRow = false,
    showSubmitButton,
    onReceivingChange,
    className,
  },
  ref
) {
  const isStandalone = useIsStandalone();
  const sync = useSharedSyncState(variant === "modal" ? sourceId : undefined);

  const [pastedInput, setPastedInput] = useState(initialPastedInput);
  const [receivePassword, setReceivePassword] = useState("");
  const [showReceivePassword, setShowReceivePassword] = useState(false);
  const [receiveRemember, setReceiveRemember] = useState(true);
  const [inboundPwOverride, setInboundPwOverride] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);

  const showSubmit = showSubmitButton ?? variant === "page";

  useEffect(() => {
    if (initialPastedInput) setPastedInput(initialPastedInput);
  }, [initialPastedInput]);

  useEffect(() => {
    onReceivingChange?.(receiving);
  }, [receiving, onReceivingChange]);

  useEffect(() => {
    if (!scannerOpen) {
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
  }, [scannerOpen]);

  const handleReceive = useCallback(async () => {
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
        onSuccess();
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
  }, [
    pastedInput,
    receivePassword,
    sync?.storedInboundPassword,
    inboundPwOverride,
    receiveRemember,
    onSuccess,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        void handleReceive();
      },
    }),
    [handleReceive]
  );

  const hasStoredInboundPw = Boolean(sync?.storedInboundPassword);
  const showReceivePwSection = !hasStoredInboundPw || inboundPwOverride;

  return (
    <div className={cn("space-y-4 text-sm", className)}>
      {isStandalone && variant === "modal" && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Usa esta opción para sincronizar desde la app instalada sin
            necesidad de abrir URLs en el navegador.
          </span>
        </div>
      )}

      {!hidePasteRow ? (
        <div className="space-y-2">
          <Label htmlFor="shared-receive-paste">URL o enlace</Label>
          <div className="flex gap-2">
            <Input
              id="shared-receive-paste"
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
              aria-controls="shared-receive-qr-scanner"
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
              id="shared-receive-qr-scanner"
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
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setScannerOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : null}
          <p className="text-muted-foreground">
            Pega la URL que te envió la otra persona o escanea su código QR.
          </p>
        </div>
      ) : null}

      {showReceivePwSection ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="shared-receive-pw">Contraseña de enlace</Label>
            <div className="flex items-center gap-2">
              <Input
                id="shared-receive-pw"
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
            <p>Se usará la contraseña guardada para esta cuenta compartida.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInboundPwOverride(true)}
              className="border-none bg-amber-500 px-3 py-5 font-medium text-white hover:bg-amber-500/80 hover:text-white dark:bg-amber-700 dark:hover:bg-amber-700/80"
            >
              Cambiar
            </Button>
          </div>
        </div>
      )}

      {showSubmit ? (
        <Button
          type="button"
          className="w-full"
          onClick={() => void handleReceive()}
          disabled={receiving || !pastedInput.trim()}
        >
          {receiving ? "Aplicando…" : "Confirmar y sincronizar"}
        </Button>
      ) : null}
    </div>
  );
});

SharedSyncReceivePanel.displayName = "SharedSyncReceivePanel";
