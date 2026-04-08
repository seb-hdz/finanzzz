"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bug } from "lucide-react";
import { Separator } from "../ui/separator";

/** Public address where you receive problem reports (edit to your inbox). */
export const REPORT_PROBLEM_EMAIL = "tu-correo@ejemplo.com";

/** Prefilled subject and body for the user's mail client. */
export const REPORT_PROBLEM_MAILTO_TEMPLATE = {
  subject: "Finanzzz — Reporte de problema",
  body: [
    "Describe qué ocurrió",
    "Una descripción clara y breve del problema.",
    "",
    "Pasos para reproducir el comportamiento (por ejemplo):",
    "1. Ir a «...»",
    "2. Hacer clic en «...»",
    "3. Desplazarse hasta «...»",
    "4. Ver el error",
    "",
    "Comportamiento esperado",
    "Una descripción clara y breve de lo que esperabas que ocurriera.",
    "",
    "Capturas de pantalla",
    "Si aplica, añade capturas para ayudar a explicar el problema.",
    "",
    "Información técnica",
    "Por favor, completa la siguiente información:",
    "",
    "Sistema operativo:",
    "En escritorio: [p. ej. Windows 10, GNU/Linux, macOS, Otro]",
    "En móvil: [p. ej. iOS 18.3.1, iOS 26.0.1, Android 14, Otro]",
    "",
    "Dispositivo: [p. ej. iPhone 16 Pro, Galaxy Flip Z3, Otro]",
    "",
    "Navegador: [p. ej. Chrome, Safari]",
    "",
    "Datos de compilación (¡búscalos en Ajustes!):",
    "Versión de la aplicación (p. ej. v0.1.7)",
    "ID de compilación (p. ej. build 26-de30896)",
    "Número de compilación (p. ej. 1775635671000)",
    "",
    "Contexto adicional",
    "Añade aquí cualquier otro contexto sobre el problema.",
    "",
  ].join("\n"),
} as const;

const REPORT_PROBLEM_GITHUB_NEW_ISSUE_URL =
  "https://github.com/seb-hdz/finanzzz/issues/new?template=report-a-problem.md";

// function reportProblemMailtoHref(): string {
//   const params = new URLSearchParams({
//     subject: REPORT_PROBLEM_MAILTO_TEMPLATE.subject,
//     body: REPORT_PROBLEM_MAILTO_TEMPLATE.body,
//   });
//   return `mailto:${REPORT_PROBLEM_EMAIL}?${params.toString()}`;
// }

type ReportProblemModalContextValue = {
  openReportProblemModal: () => void;
};

const ReportProblemModalContext =
  createContext<ReportProblemModalContextValue | null>(null);

export function useReportProblemModal(): ReportProblemModalContextValue {
  const ctx = useContext(ReportProblemModalContext);
  if (!ctx) {
    throw new Error(
      "useReportProblemModal must be used within ReportProblemModalProvider"
    );
  }
  return ctx;
}

export function ReportProblemModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openReportProblemModal = useCallback(() => setOpen(true), []);
  const value = useMemo(
    () => ({ openReportProblemModal }),
    [openReportProblemModal]
  );

  return (
    <ReportProblemModalContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reporta un problema</DialogTitle>
            <DialogDescription>
              ¿Algo salió mal? ¡Puedes reportarlo!
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex flex-col gap-2">
            {/* <Button className="w-full min-h-[2.475rem] px-[0.9rem] text-[0.9rem] sm:min-h-9 sm:px-3 sm:text-sm">
              <a
                href={reportProblemMailtoHref()}
                className="flex items-center gap-2"
              >
                <Mail className="size-4" />
                Envía un correo electrónico
              </a>
            </Button> */}
            <div className="flex flex-col">
              <Button
                variant="outline"
                className="w-full min-h-[2.475rem] px-[0.9rem] text-[0.9rem] sm:min-h-9 sm:px-3 sm:text-sm"
              >
                <a
                  href={REPORT_PROBLEM_GITHUB_NEW_ISSUE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Bug className="size-4" />
                  Reportar un issue en GitHub
                </a>
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">
                Requiere iniciar sesión en GitHub.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ReportProblemModalContext.Provider>
  );
}
