"use client";

import { useState, useSyncExternalStore } from "react";
import { MonitorSmartphone, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useIsStandalone } from "@/lib/use-standalone";
import { Logo } from "./logo";
import { ContextHint } from "./ui/context-hint";

const DISMISSED_KEY = "finanzzz:standalone-info-dismissed";

function subscribe() {
  return () => {};
}

function getPersistedDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

export function StandaloneInfoModal() {
  const isStandalone = useIsStandalone();
  const [justDismissed, setJustDismissed] = useState(false);

  const persistedDismissed = useSyncExternalStore(
    subscribe,
    getPersistedDismissed,
    () => true
  );

  const dismissed = persistedDismissed || justDismissed;
  const open = isStandalone && !dismissed;

  function handleDismiss() {
    setJustDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  if (!isStandalone) return null;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && handleDismiss()}>
      <AlertDialogContent
        size="default"
        className="max-w-[min(100%-2rem,22rem)] gap-4 sm:max-w-md md:max-w-lg"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted"
            aria-hidden
          >
            <MonitorSmartphone className="size-5" />
          </div>
          <div className="w-full space-y-3 text-left">
            <AlertDialogTitle className="text-center">
              App instalada detectada
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Estás usando <Logo muted /> como{" "}
              <ContextHint
                mode="popover"
                side="bottom"
                trigger={<span className="underline">app instalada</span>}
                triggerClassName="hover:bg-transparent active:bg-transparent focus-visible:bg-transparent"
              >
                <p className="text-xs">
                  PWA: Progressive Web App es una aplicación web que se ejecuta
                  como una app en el dispositivo.
                </p>
              </ContextHint>
              .
            </AlertDialogDescription>
            <AlertDialogDescription className="text-justify md:text-left">
              En iOS, la app instalada tiene un almacenamiento separado de
              Safari, por lo que{" "}
              <strong className="text-foreground">
                las cuentas compartidas vía URL pueden no funcionar
              </strong>{" "}
              si la otra persona abre el enlace en Safari.
            </AlertDialogDescription>
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-left text-sm leading-snug text-amber-600 dark:text-amber-400">
              <ArrowRightLeft className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Usa la opción <strong>&quot;Recibir actualización&quot;</strong>{" "}
                en el modal de sincronización y pega la URL recibida.
              </span>
            </div>
          </div>
        </div>
        <AlertDialogFooter className="justify-center sm:justify-center">
          <AlertDialogCancel render={<Button />} onClick={handleDismiss}>
            Entendido
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
