"use client";

import { cn } from "@/lib/utils";

/**
 * Dos blobs: movimiento `drift-mesh-blob-*-move` + brillo lento `*-glow` (globals.css).
 * Colocar dentro de un ancestro `relative overflow-hidden`.
 */
export function DriftingMeshBackground({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "pointer-events-none absolute -top-[20%] -left-[25%] size-[min(85vw,520px)] rounded-full bg-linear-to-br from-teal-300/45 via-cyan-200/35 to-sky-200/28 blur-3xl motion-safe:will-change-[transform,filter] dark:from-teal-600/35 dark:via-cyan-900/28 dark:to-sky-950/32",
          "drift-mesh-blob-a",
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute -right-[20%] -bottom-[25%] size-[min(80vw,480px)] rounded-full bg-linear-to-tl from-violet-200/42 via-sky-200/32 to-teal-200/36 blur-3xl motion-safe:will-change-[transform,filter] dark:from-indigo-900/40 dark:via-sky-900/30 dark:to-teal-900/34",
          "drift-mesh-blob-b",
        )}
      />
    </div>
  );
}
