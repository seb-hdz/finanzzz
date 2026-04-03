import { cn } from "@/lib/utils";

export function Logo({
  className,
  muted,
}: {
  className?: string;
  /** Marca secundaria en tonos muted (p. ej. cabecera móvil) */
  muted?: boolean;
}) {
  return (
    <span className={cn(muted && "text-muted-foreground", className)}>
      <span className="font-bold text-lg tracking-tight">Finan</span>
      <span className="relative inline-flex gap-x-0.5 items-end font-bold">
        {muted ? (
          <>
            <span className="text-lg">z</span>
            <span className="text-sm opacity-90 -ml-0.5 -translate-y-1.5">z</span>
            <span className="text-[10px] opacity-75 -ml-0.5 -translate-y-3">z</span>
          </>
        ) : (
          <>
            <span className="text-lg text-blue-500 dark:text-blue-400">z</span>
            <span className="text-sm text-blue-500/80 dark:text-blue-400/80 -ml-0.5 -translate-y-1.5">
              z
            </span>
            <span className="text-[10px] text-blue-500/60 dark:text-blue-400/60 -ml-0.5 -translate-y-3">
              z
            </span>
          </>
        )}
      </span>
    </span>
  );
}
