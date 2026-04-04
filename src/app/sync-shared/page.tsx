"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applySharedSyncFromToken } from "@/lib/shared-sync";

export default function SyncSharedPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (d) {
      setToken(d);
    }
    setReady(true);
  }, []);

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
          Este enlace no contiene datos. Pide a la otra persona un enlace generado desde
          Fuentes → Sincronizar.
        </p>
        <Button type="button" variant="outline" onClick={() => router.replace("/sources")}>
          Ir a Fuentes
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <div>
        <h1 className="text-xl font-semibold">Actualizando fuente compartida</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Introduce la contraseña acordada con la otra persona para aplicar los cambios.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="spw">Contraseña de enlace</Label>
        <Input
          id="spw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input accent-primary"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
        />
        Recordar en este dispositivo
      </label>
      <Button type="button" className="w-full" disabled={busy} onClick={handleApply}>
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
