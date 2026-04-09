"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CreditCard, Landmark, Layers, Smartphone, Users } from "lucide-react";
import type { SourceType } from "@/lib/types";
import { SOURCE_TYPE_LABELS } from "@/lib/types";

export const SOURCE_TYPE_ICONS: Record<SourceType, LucideIcon> = {
  bank_account: Landmark,
  mobile_payment: Smartphone,
  debit_card: CreditCard,
  credit_card: CreditCard,
  shared: Users,
};

export function SourceTypeIcon({
  type,
  className,
}: {
  type: SourceType;
  className?: string;
}) {
  const Icon = SOURCE_TYPE_ICONS[type];
  return <Icon className={className} />;
}

function isSourceType(value: string): value is SourceType {
  return Object.prototype.hasOwnProperty.call(SOURCE_TYPE_LABELS, value);
}

/**
 * Icono del trigger para filtro multi‑tipo: default si vacío o hay más de un tipo.
 */
export function getSourceTypeMultiSelectTriggerIcon(
  selectedTypeValues: readonly string[],
  DefaultIcon: LucideIcon
): ReactNode {
  if (selectedTypeValues.length !== 1) {
    return <DefaultIcon className="size-4" />;
  }
  const only = selectedTypeValues[0];
  if (!isSourceType(only)) {
    return <DefaultIcon className="size-4" />;
  }
  return <SourceTypeIcon type={only} className="size-4" />;
}

/**
 * Icono del trigger para filtro de un solo tipo (`all` → icono “todas”).
 */
export function getNonSharedTypeFilterTriggerIcon(
  value: "all" | Exclude<SourceType, "shared">,
  AllTypesIcon: LucideIcon = Layers
): ReactNode {
  if (value === "all") {
    return <AllTypesIcon className="size-4" />;
  }
  return <SourceTypeIcon type={value} className="size-4" />;
}
