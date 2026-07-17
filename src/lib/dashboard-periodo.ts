import { monthLabel } from "@/lib/adelantos-filters";

export const PERIODO_HISTORICO = "historico";

export function currentMonthKey(ref = new Date()): string {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
}

/** Últimos `count` meses (incluye el actual), más reciente primero. */
export function recentMonthKeys(count = 12, ref = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

export function periodoLabel(key: string): string {
  if (key === PERIODO_HISTORICO) return "Histórico (toda la vida)";
  return monthLabel(key);
}
