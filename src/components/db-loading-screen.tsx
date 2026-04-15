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
import { DriftingMeshBackground } from "@/components/decorative/drifting-mesh-background";
import { cn } from "@/lib/utils";

const LOADING_PHRASES = [
  "Configurando tu base de datos",
  "Cargando la interfaz de registro de gastos",
  "Sincronizando categorías y etiquetas",
  "Puliendo los gráficos de reportes",
  "Despertando al cerdito contable",
  "Comprobando que los números cuadren",
  "Abriendo el cajón de los recibos",
  "Enseñandole a Finanzzz dónde van los datos",
  "Recordando cuánto gastaste en café",
  "Alineando estrellas del presupuesto",
] as const;

function randomPhraseIndex(exclude: number): number {
  if (LOADING_PHRASES.length <= 1) return 0;
  let next = exclude;
  while (next === exclude) {
    next = Math.floor(Math.random() * LOADING_PHRASES.length);
  }
  return next;
}

type DbLoadingScreenProps = {
  showPhrases?: boolean;
};

export function DbLoadingScreen({ showPhrases = true }: DbLoadingScreenProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [enterSnap, setEnterSnap] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const reducedMotion = useRef(false);

  const phrase = LOADING_PHRASES[phraseIndex];

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
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  useEffect(() => {
    queueMicrotask(() => setThemeReady(true));
  }, []);

  useEffect(() => {
    if (!showPhrases) return;
    const scheduled = scheduleNext();
    return () => clearTimeout(scheduled);
  }, [phraseIndex, scheduleNext, showPhrases]);

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

  return (
    <div
      className={cn(
        "relative flex h-dvh min-h-0 w-full flex-col items-center justify-center overflow-hidden",
        themeReady && "bg-background transition-colors duration-500 ease-out"
      )}
    >
      {!themeReady && (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[oklch(1_0_0)] db-loading-pending-bg-light"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-1 bg-[oklch(0.145_0_0)] db-loading-pending-bg-dark"
            aria-hidden
          />
        </>
      )}

      {themeReady ? (
        <DriftingMeshBackground className="z-0" />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 z-2 overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-0 db-loading-pending-mesh-group-light">
            <div className="pointer-events-none absolute -top-[20%] -left-[25%] size-[min(85vw,520px)] rounded-full bg-linear-to-br from-teal-300/45 via-cyan-200/35 to-sky-200/28 blur-3xl db-loading-mesh-a" />
            <div className="pointer-events-none absolute -right-[20%] -bottom-[25%] size-[min(80vw,480px)] rounded-full bg-linear-to-tl from-violet-200/42 via-sky-200/32 to-teal-200/36 blur-3xl db-loading-mesh-b" />
          </div>
          <div className="absolute inset-0 db-loading-pending-mesh-group-dark">
            <div className="pointer-events-none absolute -top-[20%] -left-[25%] size-[min(85vw,520px)] rounded-full bg-linear-to-br from-teal-600/35 via-cyan-900/28 to-sky-950/32 blur-3xl db-loading-mesh-a" />
            <div className="pointer-events-none absolute -right-[20%] -bottom-[25%] size-[min(80vw,480px)] rounded-full bg-linear-to-tl from-indigo-900/40 via-sky-900/30 to-teal-900/34 blur-3xl db-loading-mesh-b" />
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center px-6">
        {showPhrases ? (
          <div
            className={cn(
              "transition-opacity duration-300 ease-out motion-reduce:transition-none mb-8",
              themeReady ? "text-muted-foreground" : "db-loading-pending-muted",
              leaving && "opacity-0 motion-reduce:opacity-100",
              enterSnap && "opacity-0 duration-0! motion-reduce:opacity-100",
              !leaving && !enterSnap && "opacity-100"
            )}
            aria-hidden
          >
            <span className="db-loading-typing inline-flex h-4 items-end gap-1">
              <span className="db-loading-typing-dot" />
              <span className="db-loading-typing-dot" />
              <span className="db-loading-typing-dot" />
            </span>
          </div>
        ) : null}

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

        {showPhrases ? (
          <div
            className="flex min-h-17 w-full max-w-md flex-col items-center justify-center gap-2 overflow-hidden text-center"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <p
              className={cn(
                "text-sm leading-snug transition-all duration-300 ease-out motion-reduce:transition-none",
                themeReady
                  ? "text-muted-foreground"
                  : "db-loading-pending-muted",
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
        ) : null}
      </div>
    </div>
  );
}
