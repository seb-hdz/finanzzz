"use client";

import { Badge } from "@/components/ui/badge";
import { SOURCE_TYPE_ICONS } from "@/components/source-type-icon";
import type { SourceType } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/types";
import { twMerge } from "tailwind-merge";

export function SourceBadge({
  type,
  className,
}: {
  type: SourceType;
  className?: string;
}) {
  const Icon = SOURCE_TYPE_ICONS[type];
  return (
    <Badge
      variant="secondary"
      className={twMerge("gap-1 text-xs font-normal", className)}
    >
      <Icon className="size-3" />
      {SOURCE_TYPE_LABELS[type]}
    </Badge>
  );
}
