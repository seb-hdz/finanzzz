"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { MonitorSmartphone, ArrowRightLeft, Info } from "lucide-react";
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
import { useApplePlatformKind } from "@/lib/use-apple-platform";
import { ContextHint } from "@/components/ui/context-hint";

export const STANDALONE_INFO_DISMISSED_KEY =
  "finanzzz:standalone-info-dismissed";

function subscribe() {
  return () => {};
}

function getPersistedDismissed(): boolean {
  try {
    return localStorage.getItem(STANDALONE_INFO_DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

export function StandaloneInfoModal() {
  const isStandalone = useIsStandalone();
  const { ready: appleReady, kind: appleKind } = useApplePlatformKind();
  const [justDismissed, setJustDismissed] = useState(false);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  const renderDescription = () => {
    if (!appleReady || !appleKind) {
      return (
        <>
          La app instalada puede funcionar
          <strong className="text-foreground">separada</strong> del navegador.
        </>
      );
    }

    const applePlatform = appleKind === "ios" ? "iOS" : "Safari";

    return (
      <p className="">
        En <strong className="text-foreground">{applePlatform}</strong>, el uso
        de URLs para sincronizar cuentas compartidas{" "}
        <strong className="text-foreground">es distinto</strong> a Safari.
      </p>
    );
  };

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
      localStorage.setItem(STANDALONE_INFO_DISMISSED_KEY, "1");
    } catch {}
    window.dispatchEvent(new Event("finanzzz:standalone-info-dismissed"));
  }

  if (!isStandalone) return null;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && handleDismiss()}>
      <AlertDialogContent
        size="default"
        className="max-w-[min(100%-2rem,22rem)] gap-4 sm:max-w-md md:max-w-lg"
        initialFocus={dismissButtonRef}
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
              <ContextHint
                mode="popover"
                side="bottom"
                trigger={
                  <span className="inline-flex items-center gap-1.5">
                    Estás usando la app instalada <Info className="size-3.5" />{" "}
                  </span>
                }
                triggerClassName="hover:bg-transparent active:bg-transparent focus-visible:bg-transparent"
              >
                <p className="text-xs">
                  PWA: Progressive Web App es una aplicación web que se ejecuta
                  como una app en el dispositivo.
                </p>
              </ContextHint>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {renderDescription()}
            </AlertDialogDescription>
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-left text-sm leading-snug text-amber-600 dark:text-amber-400">
              <ArrowRightLeft className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Ve a <strong>&quot;Recibir actualización&quot;</strong> en
                cuentas compartidas.
              </span>
            </div>
          </div>
        </div>
        <AlertDialogFooter className="justify-center md:justify-end">
          <AlertDialogCancel
            ref={dismissButtonRef}
            render={<Button />}
            onClick={handleDismiss}
          >
            Entendido
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
