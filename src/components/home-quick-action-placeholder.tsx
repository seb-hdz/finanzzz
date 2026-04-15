"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HOME_QUICK_ACTION_SETTINGS_HREF } from "@/lib/home-quick-actions";

export function HomeQuickActionPlaceholder() {
  return (
    <Link
      href={HOME_QUICK_ACTION_SETTINGS_HREF}
      scroll={false}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "h-auto min-h-8 min-w-0 max-w-[11.5rem] shrink gap-2 whitespace-normal border border-dashed border-border/60 bg-muted/15 px-2.5 py-2 text-muted-foreground hover:border-border hover:bg-muted/30 hover:text-foreground sm:max-w-[13rem]"
      )}
      aria-label="Ir a Ajustes para configurar la acción rápida en Inicio"
      title="Configurar acción rápida"
    >
      <Zap className="mt-0.5 size-4 shrink-0 self-start opacity-80" />
      <span className="min-w-0 flex-1 text-left text-xs leading-snug wrap-break-word hyphens-auto line-clamp-2">
        Acción rápida
      </span>
    </Link>
  );
}
