import { useMemo, useState } from "react";
import type { Adelanto, Empresa, EstadoAdelanto } from "@/lib/admin-store";

export type AdelantosFiltersOptions = {
  /** Estados visibles cuando el filtro de estado está en "Todos". */
  defaultEstados?: EstadoAdelanto[];
  /** Orden por fecha de solicitud. */
  sortOrder?: "asc" | "desc";
};

export function monthKey(d: string) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

export function dateKey(d: string) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inDateRange(fechaSolicitud: string, desde: string, hasta: string) {
  const key = dateKey(fechaSolicitud);
  if (desde && key < desde) return false;
  if (hasta && key > hasta) return false;
  return true;
}

export function useAdelantosFilters(
  adelantos: Adelanto[],
  empresas: Empresa[],
  options: AdelantosFiltersOptions = {},
) {
  const { defaultEstados, sortOrder = "desc" } = options;
  const months = useMemo(() => {
    const set = new Set(adelantos.map((a) => monthKey(a.fechaSolicitud)));
    return Array.from(set).sort().reverse();
  }, [adelantos]);

  const [mes, setMes] = useState<string>("all");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [empresaId, setEmpresaId] = useState<string>("all");
  const [estado, setEstado] = useState<string>("all");

  const filtered = useMemo(() => {
    const sorted = adelantos
      .filter((a) => (mes === "all" ? true : monthKey(a.fechaSolicitud) === mes))
      .filter((a) => inDateRange(a.fechaSolicitud, fechaDesde, fechaHasta))
      .filter((a) => (empresaId === "all" ? true : a.empresaId === empresaId))
      .filter((a) => {
        if (estado !== "all") return a.estado === estado;
        if (defaultEstados) return defaultEstados.includes(a.estado);
        return true;
      });

    return sorted.sort((a, b) => {
      const diff = +new Date(a.fechaSolicitud) - +new Date(b.fechaSolicitud);
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [adelantos, mes, fechaDesde, fechaHasta, empresaId, estado, defaultEstados, sortOrder]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, a) => s + a.monto, 0);
    const aprobados = filtered.filter((a) => a.estado === "aprobado");
    const totalAprobado = aprobados.reduce((s, a) => s + a.monto, 0);
    const pagados = filtered.filter((a) => a.estado === "pagado");
    const totalPagado = pagados.reduce((s, a) => s + a.monto, 0);
    return { total, totalAprobado, totalPagado, countAprobado: aprobados.length };
  }, [filtered]);

  const porEmpresa = useMemo(() => {
    const map = new Map<string, { count: number; total: number; aprobado: number }>();
    for (const a of filtered) {
      const e = map.get(a.empresaId) ?? { count: 0, total: 0, aprobado: 0 };
      e.count++;
      e.total += a.monto;
      if (a.estado === "aprobado") e.aprobado += a.monto;
      map.set(a.empresaId, e);
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ empresa: empresas.find((x) => x.id === id), ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, empresas]);

  const clearFilters = () => {
    setMes("all");
    setFechaDesde("");
    setFechaHasta("");
    setEmpresaId("all");
    setEstado("all");
  };

  const hasActiveFilters =
    mes !== "all" ||
    fechaDesde !== "" ||
    fechaHasta !== "" ||
    empresaId !== "all" ||
    estado !== "all";

  return {
    months,
    mes,
    setMes,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    empresaId,
    setEmpresaId,
    estado,
    setEstado,
    filtered,
    totals,
    porEmpresa,
    clearFilters,
    hasActiveFilters,
  };
}
