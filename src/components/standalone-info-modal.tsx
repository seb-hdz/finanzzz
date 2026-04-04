"use client";

import { useState, useEffect } from "react";
import { MonitorSmartphone, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useIsStandalone } from "@/lib/use-standalone";

const DISMISSED_KEY = "finanzzz:standalone-info-dismissed";

export function StandaloneInfoModal() {
  const isStandalone = useIsStandalone();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isStandalone) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      return;
    }
    setOpen(true);
  }, [isStandalone]);

  function handleDismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  if (!isStandalone) return null;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && handleDismiss()}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <MonitorSmartphone className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>App instalada detectada</AlertDialogTitle>
          <AlertDialogDescription>
            Estás usando Finanzzz como app instalada (PWA). En iOS, la app
            instalada tiene un almacenamiento separado de Safari, por lo que{" "}
            <strong className="text-foreground">
              las cuentas compartidas vía URL pueden no funcionar
            </strong>{" "}
            si la otra persona abre el enlace en Safari.
          </AlertDialogDescription>
          <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm leading-snug text-amber-600 dark:text-amber-400">
            <ArrowRightLeft className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Usa la opción <strong>&quot;Recibir actualización&quot;</strong> en
              el modal de sincronización para pegar el token directamente dentro
              de la app, sin necesidad de abrir URLs.
            </span>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button />} onClick={handleDismiss}>
            Entendido
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
