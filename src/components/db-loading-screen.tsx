"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
import logoMark from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

const LOADING_PHRASES = [
  "Preparándolo todo…",
  "Configurando tu base de datos local…",
  "Cargando la interfaz de registro de gastos…",
  "Sincronizando categorías y etiquetas…",
  "Puliendo los gráficos de reportes…",
  "Despertando al axolotl contable…",
  "Comprobando que los números cuadren…",
  "Abriendo el cajón de los recibos…",
  "Enseñandole a Finanzzz dónde van los datos…",
  "Casi listo: últimos retoques…",
  "Calentando motores del panel de fuentes…",
  "Recordando cuánto gastaste en café…",
  "Alineando estrellas del presupuesto…",
];

function randomPhraseIndex(exclude: number): number {
  if (LOADING_PHRASES.length <= 1) return 0;
  let next = exclude;
  while (next === exclude) {
    next = Math.floor(Math.random() * LOADING_PHRASES.length);
  }
  return next;
}

export function DbLoadingScreen() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [enterSnap, setEnterSnap] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  const scheduleNext = useCallback(() => {
    const delay = 2000 + Math.random() * 1000;
    return window.setTimeout(() => {
      if (reducedMotion.current) {
        setPhraseIndex((i) => randomPhraseIndex(i));
        return;
      }
      setLeaving(true);
    }, delay);
  }, []);

  useEffect(() => {
    const id = scheduleNext();
    return () => clearTimeout(id);
  }, [phraseIndex, scheduleNext]);

  const onPhraseTransitionEnd = (e: TransitionEvent<HTMLParagraphElement>) => {
    if (e.propertyName !== "opacity") return;
    if (!leaving) return;
    setLeaving(false);
    setPhraseIndex((i) => randomPhraseIndex(i));
    setEnterSnap(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEnterSnap(false));
    });
  };

  const phrase = LOADING_PHRASES[phraseIndex];

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <div
        className={cn(
          "pointer-events-none absolute -top-[20%] -left-[25%] size-[min(85vw,520px)] rounded-full bg-linear-to-br from-teal-300/35 via-cyan-200/25 to-sky-200/20 blur-3xl transition-colors duration-1000 ease-out dark:from-teal-600/25 dark:via-cyan-900/20 dark:to-sky-950/25",
          "db-loading-mesh-a"
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute -right-[20%] -bottom-[25%] size-[min(80vw,480px)] rounded-full bg-linear-to-tl from-violet-200/30 via-sky-200/20 to-teal-200/25 blur-3xl transition-colors duration-1000 ease-out dark:from-indigo-900/30 dark:via-sky-900/20 dark:to-teal-900/25",
          "db-loading-mesh-b"
        )}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        <div className="db-loading-logo-float">
          <Image
            src={logoMark}
            alt=""
            width={96}
            height={96}
            priority
            className="size-24 object-contain drop-shadow-sm"
          />
        </div>

        <div
          className="flex min-h-13 w-full max-w-md items-center justify-center overflow-hidden text-center"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p
            className={cn(
              "text-sm leading-snug text-muted-foreground transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
              leaving &&
                "-translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
              enterSnap &&
                "translate-y-5 opacity-0 duration-0! motion-reduce:translate-y-0 motion-reduce:opacity-100",
              !leaving && !enterSnap && "translate-y-0 opacity-100"
            )}
            onTransitionEnd={onPhraseTransitionEnd}
          >
            {phrase}
          </p>
        </div>
      </div>
    </div>
  );
}
