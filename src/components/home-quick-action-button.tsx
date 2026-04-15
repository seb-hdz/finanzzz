"use client";

import { Button } from "@/components/ui/button";
import {
  HOME_QUICK_ACTIONS,
  type HomeQuickActionId,
} from "@/lib/home-quick-actions";
import { useRouter } from "next/navigation";

export function HomeQuickActionButton({
  actionId,
}: {
  actionId: HomeQuickActionId;
}) {
  const def = HOME_QUICK_ACTIONS[actionId];
  const Icon = def.Icon;
  const { push } = useRouter();

  const getLabel = () => {
    if (actionId === "sync_shared") {
      return "Sincronización";
    }
    return def.label;
  };

  return (
    <Button
      type="button"
      variant="default"
      className="h-auto min-h-8 min-w-0 max-w-[11.5rem] shrink gap-2 whitespace-normal px-2.5 py-2 sm:max-w-[13rem]"
      onClick={() => void push(def.href)}
      aria-label={def.ariaLabel}
      title={def.label}
    >
      <Icon className="mt-0.5 size-4 shrink-0 self-start text-primary-foreground" />
      <span className="min-w-0 flex-1 text-left text-sm leading-snug wrap-break-word hyphens-auto line-clamp-2">
        {getLabel()}
      </span>
    </Button>
  );
}
