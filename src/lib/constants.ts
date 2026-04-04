import type { Tag, GlobalConfig } from "./types";

export const PREDEFINED_TAGS: Omit<Tag, "id">[] = [
  { name: "Comida", color: "#f97316", isPredefined: true },
  { name: "Transporte", color: "#3b82f6", isPredefined: true },
  { name: "Entretenimiento", color: "#8b5cf6", isPredefined: true },
  { name: "Salud", color: "#22c55e", isPredefined: true },
  { name: "Educación", color: "#06b6d4", isPredefined: true },
  { name: "Hogar", color: "#f59e0b", isPredefined: true },
  { name: "Ropa", color: "#ec4899", isPredefined: true },
  { name: "Tecnología", color: "#6366f1", isPredefined: true },
  { name: "Servicios", color: "#14b8a6", isPredefined: true },
  { name: "Suscripciones", color: "#a855f7", isPredefined: true },
  { name: "Mascotas", color: "#84cc16", isPredefined: true },
  { name: "Otros", color: "#737373", isPredefined: true },
];

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  id: "global",
  totalMaxLimit: -1,
  limitInterval: "monthly",
  warningThreshold: 0.7,
  dangerThreshold: 0.9,
  sharedStaleHours: 168,
};

export const CURRENCY = "PEN";
export const CURRENCY_SYMBOL = "S/";
