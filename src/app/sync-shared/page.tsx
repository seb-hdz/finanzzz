"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedSyncReceivePanel } from "@/components/shared-sync-receive-panel";
import { applySharedSyncFromToken } from "@/lib/shared-sync";
import { db } from "@/lib/db";
import { useIsStandalone } from "@/lib/use-standalone";
import { useApplePlatformKind } from "@/lib/use-apple-platform";
import { consumeShareTargetStash } from "@/lib/share-stash";

type Phase = "boot" | "d-auto" | "d-password" | "receive";

export default function SyncSharedPage() {
  const router = useRouter();
  const isStandalone = useIsStandalone();
  const { ready: appleReady, kind: appleKind } = useApplePlatformKind();
  const isApplePlatform = appleReady && appleKind !== null;

  const [phase, setPhase] = useState<Phase>("boot");
  const [dToken, setDToken] = useState<string | null>(null);
  const [stashPasted, setStashPasted] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const share = params.get("share");

      let fromStash = "";
      if (share === "1") {
        const stash = await consumeShareTargetStash();
        fromStash = stash?.pastedInput?.trim() ?? "";
        params.delete("share");
        const qs = params.toString();
        const path = window.location.pathname;
        window.history.replaceState(null, "", qs ? `${path}?${qs}` : path);
      }

      const d = params.get("d");
      if (d) {
        setDToken(d);
        setPhase("d-auto");
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
              if (!cancelled) {
                toast.success(
                  result.mergedCount > 0
                    ? `Sincronizado: ${result.mergedCount} actualización(es).`
                    : "Sincronizado (sin gastos nuevos en este enlace)."
                );
                router.replace("/sources");
              }
              return;
            }
          }
        } catch {
          // fall through
        }
        if (!cancelled) setPhase("d-password");
        return;
      }

      if (!cancelled) {
        setStashPasted(fromStash);
        setPhase("receive");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (phase === "boot" || phase === "d-auto") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (phase === "d-password" && dToken) {
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
        <SharedSyncReceivePanel
          variant="page"
          initialPastedInput={dToken}
          hidePasteRow
          showSubmitButton
          onSuccess={() => router.replace("/sources")}
        />
        {!isStandalone && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
            <MonitorSmartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Si tienes Finanzzz instalada como PWA, este enlace podría fallar
              porque{" "}
              {isApplePlatform ? (
                <>Safari no comparte datos con la app instalada.</>
              ) : (
                <>el navegador puede no compartir datos con la app instalada.</>
              )}{" "}
              Usa <strong>Sincronizar &rarr; Recibir</strong> en la app instalada.
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-xl font-semibold">Sincronización compartida</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pega la URL o escanea el código QR que te envió la otra persona. Luego
          introduce la contraseña de enlace y confirma.
        </p>
      </div>
      <SharedSyncReceivePanel
        variant="page"
        initialPastedInput={stashPasted}
        showSubmitButton
        onSuccess={() => router.replace("/sources")}
      />
      {!isStandalone && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
          <MonitorSmartphone className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Si usas Finanzzz instalada como app, comparte enlaces hacia la app
            desde el menú del sistema cuando esté disponible.{" "}
            {isApplePlatform ? (
              <>Safari y la app instalada no comparten datos.</>
            ) : (
              <>El navegador y la app instalada pueden no compartir datos.</>
            )}
          </span>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => router.replace("/sources")}
      >
        Ir a Fuentes
      </Button>
    </div>
  );
}
