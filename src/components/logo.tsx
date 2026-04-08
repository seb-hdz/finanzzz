import { cn } from "@/lib/utils";

export function Logo({
  className,
  muted,
  showAuthor,
}: {
  className?: string;
  /** Marca secundaria en tonos muted (p. ej. cabecera móvil) */
  muted?: boolean;
  /** Muestra el autor */
  showAuthor?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span
        className={cn(
          muted && "text-muted-foreground inline-flex items-center flex-nowrap",
          className
        )}
      >
        <span className="font-bold text-lg tracking-tight">Finan</span>
        <span className="relative inline-flex gap-x-0.5 items-end font-bold">
          {muted ? (
            <>
              <span className="text-lg">z</span>
              <span className="text-sm opacity-90 -ml-0.5 -translate-y-1.5">
                z
              </span>
              <span className="text-[10px] opacity-75 -ml-0.5 -translate-y-3">
                z
              </span>
            </>
          ) : (
            <>
              <span className="text-lg text-blue-500 dark:text-blue-400">
                z
              </span>
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
      {showAuthor ? (
        <p className="text-xs text-muted-foreground/50 -mt-1">by @seb-hdz</p>
      ) : null}
    </div>
  );
}
