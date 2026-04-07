"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applySharedSyncFromToken } from "@/lib/shared-sync";
import { db } from "@/lib/db";
import { useIsStandalone } from "@/lib/use-standalone";
import { useApplePlatformKind } from "@/lib/use-apple-platform";

export default function SyncSharedPage() {
  const router = useRouter();
  const isStandalone = useIsStandalone();
  const { ready: appleReady, kind: appleKind } = useApplePlatformKind();
  const isApplePlatform = appleReady && appleKind !== null;
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (!d) {
      setReady(true);
      return;
    }
    setToken(d);

    (async () => {
      try {
        const allSync = await db.sharedSync.toArray();
        for (const s of allSync) {
          if (!s.storedInboundPassword) continue;
          const result = await applySharedSyncFromToken({
            token: d,
            password: s.storedInboundPassword,
            rememberPassword: true,
          });
          if (result.ok) {
            toast.success(
              result.mergedCount > 0
                ? `Sincronizado: ${result.mergedCount} actualización(es).`
                : "Sincronizado (sin gastos nuevos en este enlace)."
            );
            router.replace("/sources");
            return;
          }
        }
      } catch {
        // fall through to manual form
      }
      setReady(true);
    })();
  }, [router]);

  async function handleApply() {
    if (!token.trim() || !password) {
      toast.error("Introduce la contraseña de enlace.");
      return;
    }
    setBusy(true);
    try {
      const result = await applySharedSyncFromToken({
        token,
        password,
        rememberPassword: remember,
      });
      if (result.ok) {
        toast.success(
          result.mergedCount > 0
            ? `Sincronizado: ${result.mergedCount} actualización(es).`
            : "Sincronizado (sin gastos nuevos en este enlace)."
        );
        router.replace("/sources");
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-8">
        <h1 className="text-xl font-semibold">Sincronización compartida</h1>
        <p className="text-sm text-muted-foreground">
          Este enlace no contiene datos. Pide a la otra persona un enlace
          generado desde Fuentes &rarr; Sincronizar.
        </p>
        {!isStandalone && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
            <MonitorSmartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Si tienes Finanzzz instalada como app (PWA), ábrela y usa{" "}
              <strong>Sincronizar &rarr; Recibir</strong> en tu fuente
              compartida para pegar la URL directamente.{" "}
              {isApplePlatform ? (
                <>Safari y la app instalada no comparten datos.</>
              ) : (
                <>
                  El navegador y la app instalada pueden no compartir datos.
                </>
              )}
            </span>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => router.replace("/sources")}
        >
          Ir a Fuentes
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-xl font-semibold">
          Actualizando fuente compartida
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Introduce la contraseña acordada con la otra persona para aplicar los
          cambios.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="spw">Contraseña de enlace</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="spw"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            className="min-w-0"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword
                ? "Ocultar contraseña de enlace"
                : "Mostrar contraseña de enlace"
            }
          >
            {showPassword ? (
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
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Recordar contraseña en este dispositivo
      </label>
      {!isStandalone && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
          <MonitorSmartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Si tienes Finanzzz instalada como app (PWA), este enlace podría
            fallar porque{" "}
            {isApplePlatform ? (
              <>Safari no comparte datos con la app instalada.</>
            ) : (
              <>
                el navegador puede no compartir datos con la app instalada.
              </>
            )}{" "}
            Usa <strong>Sincronizar &rarr; Recibir</strong> dentro de la app.
          </span>
        </div>
      )}
      <Button
        type="button"
        className="w-full"
        disabled={busy}
        onClick={handleApply}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Aplicando…
          </>
        ) : (
          "Confirmar y sincronizar"
        )}
      </Button>
    </div>
  );
}
