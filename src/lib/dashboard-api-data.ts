import type { MonthlyTrendPoint } from "@/lib/dashboard-chart-data";
import type { Adelanto } from "@/lib/admin-store";
import type { DashboardAdelantosApi } from "@/lib/api/types";

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function dashboardToMonthlyTrend(data: DashboardAdelantosApi): MonthlyTrendPoint[] {
  return data.monto_solicitado_por_mes.map((m) => ({
    key: `${m.anio}-${String(m.mes).padStart(2, "0")}`,
    label: MESES_CORTOS[m.mes - 1] ?? String(m.mes),
    total: Number(m.monto_total),
    cantidad: m.total,
    pagado: 0,
    aprobado: 0,
    en_revision: 0,
    solicitado: Number(m.monto_total),
    rechazado: 0,
  }));
}

export function adelantosToEmpresaBars(adelantos: Adelanto[]) {
  const map = new Map<
    string,
    { id: string; nombre: string; nombreCorto: string; activa: boolean; total: number; cantidad: number }
  >();

  for (const a of adelantos) {
    const cur = map.get(a.empresaId) ?? {
      id: a.empresaId,
      nombre: a.empresaNombre ?? a.empresaId,
      nombreCorto: (a.empresaNombre ?? a.empresaId).slice(0, 14),
      activa: true,
      total: 0,
      cantidad: 0,
    };
    cur.total += a.monto;
    cur.cantidad += 1;
    map.set(a.empresaId, cur);
  }

  return Array.from(map.values())
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
}
