"use client";

import { Landmark, Smartphone, CreditCard, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SourceType } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/types";
import { twMerge } from "tailwind-merge";

const ICONS: Record<SourceType, React.ElementType> = {
  bank_account: Landmark,
  mobile_payment: Smartphone,
  debit_card: CreditCard,
  credit_card: CreditCard,
  shared: Users,
};

export function SourceBadge({
  type,
  className,
}: {
  type: SourceType;
  className?: string;
}) {
  const Icon = ICONS[type];
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
