export interface FakeSeedOptions {
  customTagCount: number;
  sourcesPerType: number;
  expenseCount: number;
  expenseDateStartMs: number;
  expenseDateEndMs: number;
}

/** 1 Jul año calendario anterior → fin del día de hoy (configurable vía overrides). */
export function defaultFakeSeedOptions(now = new Date()): FakeSeedOptions {
  const year = now.getFullYear();
  const start = new Date(year - 1, 6, 1, 0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return {
    customTagCount: 8,
    sourcesPerType: 2,
    expenseCount: 120,
    expenseDateStartMs: start.getTime(),
    expenseDateEndMs: end.getTime(),
  };
}
