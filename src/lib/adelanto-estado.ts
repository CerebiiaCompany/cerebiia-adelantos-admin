import type { EstadoAdelanto } from "@/lib/admin-store";

/**
 * Colores de estado:
 * - En curso (solicitado / en_revisión / aprobado) → amarillo claro
 * - Pagado → verde claro
 * - Rechazado → rojo claro
 */
export const ESTADO_BADGE_CLASSES: Record<EstadoAdelanto, string> = {
  solicitado: "bg-amber-50 text-amber-900 border-amber-200/80",
  en_revision: "bg-amber-50 text-amber-900 border-amber-200/80",
  aprobado: "bg-amber-50 text-amber-900 border-amber-200/80",
  pagado: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  rechazado: "bg-rose-50 text-rose-800 border-rose-200/80",
};

export const ESTADO_TEXT_CLASSES: Record<EstadoAdelanto, string> = {
  solicitado: "text-amber-800",
  en_revision: "text-amber-800",
  aprobado: "text-amber-800",
  pagado: "text-emerald-700",
  rechazado: "text-rose-700",
};

/** Color del badge según cantidad de cuotas (1, 2, 3…). */
export function cuotaCountBadgeClass(numeroCuotas: number): string {
  const n = Math.max(1, Math.floor(numeroCuotas) || 1);
  const palette = [
    "bg-emerald-50 text-emerald-800 border border-emerald-200/80", // 1
    "bg-sky-50 text-sky-800 border border-sky-200/80", // 2
    "bg-violet-50 text-violet-800 border border-violet-200/80", // 3
    "bg-amber-50 text-amber-900 border border-amber-200/80", // 4
    "bg-rose-50 text-rose-800 border border-rose-200/80", // 5
    "bg-teal-50 text-teal-800 border border-teal-200/80", // 6+
  ];
  return palette[Math.min(n, palette.length) - 1]!;
}
