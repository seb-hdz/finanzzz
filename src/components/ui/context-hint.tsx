"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

export type ContextHintMode = "popover" | "expandable" | "expandable-inner";

export type ContextHintProps = Omit<PopoverPrimitive.Root.Props, "children"> & {
  mode: ContextHintMode;
  /** Elemento interactivo mostrado como ancla (icono, botón, etc.). */
  trigger: React.ReactNode;
  /** Texto o nodo React dentro del panel flotante. */
  children: React.ReactNode;
  side?: PopoverPrimitive.Positioner.Props["side"];
  align?: PopoverPrimitive.Positioner.Props["align"];
  sideOffset?: number;
  alignOffset?: number;
  /** Clases del contenedor alrededor del root (inline-flex por defecto). */
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
  /** Etiqueta accesible cuando el trigger es solo un icono. */
  "aria-label"?: string;
};

function subscribeFineHover(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getFineHoverSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function usePrefersFineHover() {
  return React.useSyncExternalStore(
    subscribeFineHover,
    getFineHoverSnapshot,
    () => false
  );
}

function ContextHintPopover({
  trigger,
  content,
  side,
  align,
  sideOffset,
  alignOffset,
  className,
  contentClassName,
  triggerClassName,
  ariaLabel,
  rootProps,
}: {
  trigger: React.ReactNode;
  content: React.ReactNode;
  side: NonNullable<ContextHintProps["side"]>;
  align: NonNullable<ContextHintProps["align"]>;
  sideOffset: number;
  alignOffset: number;
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
  ariaLabel?: string;
  rootProps: Omit<PopoverPrimitive.Root.Props, "children">;
}) {
  return (
    <div className={cn("inline-flex", className)}>
      <PopoverPrimitive.Root {...rootProps}>
        <PopoverPrimitive.Trigger
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            triggerClassName
          )}
          aria-label={ariaLabel}
        >
          {trigger}
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner
            align={align}
            alignOffset={alignOffset}
            side={side}
            sideOffset={sideOffset}
            className="isolate z-50"
          >
            <PopoverPrimitive.Popup
              data-slot="context-hint-content"
              className={cn(
                "z-50 w-fit max-w-xs origin-(--transform-origin) rounded-lg bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                contentClassName
              )}
            >
              {content}
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

/** Padding compacto compartido por variantes expandable (sin color de texto). */
const expandableInset = "pt-0.5 leading-snug";

/** Animación de ancho sin medir el DOM (0fr → 1fr). */
const expandableWidthShell = cn(
  "grid min-w-0 overflow-hidden transition-[grid-template-columns] duration-300 ease-out",
  "motion-reduce:transition-none motion-reduce:duration-0"
);

function ContextHintExpandableAdjacent({
  trigger,
  content,
  className,
  contentClassName,
  triggerClassName,
  ariaLabel,
}: {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}) {
  const fineHover = usePrefersFineHover();
  const [hoverInside, setHoverInside] = React.useState(false);
  const [focusInside, setFocusInside] = React.useState(false);
  const [touchOpen, setTouchOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const open = fineHover ? hoverInside || focusInside : touchOpen;

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (next && containerRef.current?.contains(next)) return;
    setFocusInside(false);
  }

  React.useEffect(() => {
    if (fineHover || !touchOpen) return;
    function onPointerDown(e: PointerEvent) {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) setTouchOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [fineHover, touchOpen]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-1.5",
        className
      )}
      onMouseEnter={() => fineHover && setHoverInside(true)}
      onMouseLeave={() => fineHover && setHoverInside(false)}
      onFocusCapture={() => fineHover && setFocusInside(true)}
      onBlurCapture={handleContainerBlur}
    >
      <button
        type="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          triggerClassName
        )}
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (!fineHover) setTouchOpen((v) => !v);
        }}
      >
        {trigger}
      </button>
      <div
        data-slot="context-hint-expandable"
        className={cn(
          expandableWidthShell,
          open ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
        )}
        aria-hidden={!open}
      >
        <div className="min-w-0 overflow-hidden">
          <div
            className={cn(
              "w-max max-w-xs rounded-md border border-border bg-popover text-popover-foreground shadow-sm ring-1 ring-foreground/5",
              expandableInset,
              contentClassName
            )}
          >
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContextHintExpandableInner({
  trigger,
  content,
  className,
  contentClassName,
  triggerClassName,
  ariaLabel,
}: {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
  ariaLabel?: string;
}) {
  const fineHover = usePrefersFineHover();
  const [hoverInside, setHoverInside] = React.useState(false);
  const [focusInside, setFocusInside] = React.useState(false);
  const [touchOpen, setTouchOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLButtonElement>(null);

  const open = fineHover ? hoverInside || focusInside : touchOpen;

  function handleBlur(e: React.FocusEvent<HTMLButtonElement>) {
    const next = e.relatedTarget as Node | null;
    if (next && rootRef.current?.contains(next)) return;
    setFocusInside(false);
  }

  React.useEffect(() => {
    if (fineHover || !touchOpen) return;
    function onPointerDown(e: PointerEvent) {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setTouchOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [fineHover, touchOpen]);

  return (
    <button
      ref={rootRef}
      type="button"
      data-slot="context-hint-expandable-inner"
      aria-expanded={open}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md border text-left outline-none transition-[border-color,background-color,box-shadow,color] pr-1.5",
        open
          ? "border-border bg-popover text-popover-foreground shadow-sm ring-1 ring-foreground/5"
          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        expandableInset,
        open ? "text-popover-foreground" : "text-muted-foreground",
        className
      )}
      onMouseEnter={() => fineHover && setHoverInside(true)}
      onMouseLeave={() => fineHover && setHoverInside(false)}
      onFocus={() => fineHover && setFocusInside(true)}
      onBlur={handleBlur}
      onClick={() => {
        if (!fineHover) setTouchOpen((v) => !v);
      }}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center self-center [&_svg]:pointer-events-none",
          triggerClassName
        )}
        aria-hidden
      >
        {trigger}
      </span>
      <span
        className={cn(
          expandableWidthShell,
          open ? "grid-cols-[1fr]" : "grid-cols-[0fr]"
        )}
        aria-hidden={!open}
      >
        <span className="min-w-0 overflow-hidden">
          <span
            className={cn(
              "inline-block w-max max-w-[min(18rem,calc(100vw-2rem))] text-left text-sm",
              contentClassName
            )}
          >
            {content}
          </span>
        </span>
      </span>
    </button>
  );
}

function ContextHint({
  mode,
  trigger,
  children,
  side = "top",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  className,
  contentClassName,
  triggerClassName,
  "aria-label": ariaLabel,
  ...rootProps
}: ContextHintProps) {
  const content =
    typeof children === "string" ? (
      <span className="text-sm leading-snug">{children}</span>
    ) : (
      children
    );

  if (mode === "expandable") {
    return (
      <ContextHintExpandableAdjacent
        trigger={trigger}
        content={content}
        className={className}
        contentClassName={contentClassName}
        triggerClassName={triggerClassName}
        ariaLabel={ariaLabel}
      />
    );
  }

  if (mode === "expandable-inner") {
    return (
      <ContextHintExpandableInner
        trigger={trigger}
        content={content}
        className={className}
        contentClassName={contentClassName}
        triggerClassName={triggerClassName}
        ariaLabel={ariaLabel}
      />
    );
  }

  return (
    <ContextHintPopover
      trigger={trigger}
      content={content}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      className={className}
      contentClassName={contentClassName}
      triggerClassName={triggerClassName}
      ariaLabel={ariaLabel}
      rootProps={rootProps}
    />
  );
}

export { ContextHint };
