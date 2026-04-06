import {
  rand,
  randBrand,
  randCity,
  randPhoneNumber,
  randProductName,
} from "@ngneat/falso";
import type { Source, SourceType } from "@/lib/types";
import { PRESET_COLORS } from "@/lib/types";

export type SeedableSourceType = Exclude<SourceType, "shared">;

export function buildSource(
  type: SeedableSourceType
): Omit<Source, "id" | "createdAt"> {
  let name: string;
  switch (type) {
    case "bank_account":
      name = `Cuenta ${randCity()}`;
      break;
    case "mobile_payment":
      name = `Monedero Digital ${randPhoneNumber()}`;
      break;
    case "debit_card":
      name = `Débito ${randBrand()}`;
      break;
    case "credit_card":
      name = `Crédito ${randProductName()}`;
      break;
  }
  return {
    name: name.slice(0, 80),
    type,
    color: rand(PRESET_COLORS),
    icon: type,
    minLimit: -1,
    maxLimit: -1,
  };
}
