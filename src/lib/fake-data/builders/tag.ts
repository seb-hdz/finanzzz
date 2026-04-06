import { rand, randProductCategory } from "@ngneat/falso";
import type { Tag } from "@/lib/types";
import { PRESET_COLORS } from "@/lib/types";

export function buildCustomTag(): Omit<Tag, "id"> {
  return {
    name: randProductCategory().slice(0, 48),
    color: rand(PRESET_COLORS),
    isPredefined: false,
  };
}
