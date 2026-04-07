"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
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
import { STANDALONE_INFO_DISMISSED_KEY } from "@/components/modals/standalone-info-modal";

function subscribeOnline(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
}

function readStandaloneDismissed(): boolean {
  try {
    return localStorage.getItem(STANDALONE_INFO_DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

function OfflineInfoModalDialog({
  online,
  standaloneBlocking,
}: {
  online: boolean;
  standaloneBlocking: boolean;
}) {
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const show = !online && !standaloneBlocking && !sessionDismissed;

  function handleDismiss() {
    setSessionDismissed(true);
  }

  return (
    <AlertDialog open={show} onOpenChange={(o) => !o && handleDismiss()}>
      <AlertDialogContent
        size="default"
        className="max-w-[min(100%-2rem,22rem)] gap-4 sm:max-w-md md:max-w-lg"
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted"
            aria-hidden
          >
            <WifiOff className="size-5 text-destructive" />
          </div>
          <div className="w-full space-y-3 text-left">
            <AlertDialogTitle className="text-center">
              Sin conexión
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              No se detectó conexión a Internet. Tus datos en este dispositivo
              siguen disponibles hasta que vuelvas a estar en línea.
            </AlertDialogDescription>
          </div>
        </div>
        <AlertDialogFooter className="justify-center md:justify-end">
          <AlertDialogCancel render={<Button />} onClick={handleDismiss}>
            Entendido
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function OfflineInfoModal() {
  const isStandalone = useIsStandalone();
  const online = useOnline();
  const [standaloneDismissed, setStandaloneDismissed] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    function syncStandaloneDismissed() {
      setStandaloneDismissed(readStandaloneDismissed());
    }
    queueMicrotask(syncStandaloneDismissed);
    window.addEventListener(
      "finanzzz:standalone-info-dismissed",
      syncStandaloneDismissed
    );
    return () =>
      window.removeEventListener(
        "finanzzz:standalone-info-dismissed",
        syncStandaloneDismissed
      );
  }, []);

  const standaloneBlocking = isStandalone && standaloneDismissed !== true;

  return (
    <OfflineInfoModalDialog
      key={online ? "online" : "offline"}
      online={online}
      standaloneBlocking={standaloneBlocking}
    />
  );
}
