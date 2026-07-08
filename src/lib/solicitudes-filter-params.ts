import type { EstadoAdelanto, Empresa } from "@/lib/admin-store";
import type { Adelanto } from "@/lib/admin-store";
import type { ListSolicitudesAdminParams } from "@/lib/api/types";
import { monthKey } from "@/lib/adelantos-filters";

export function buildSolicitudesApiParams(opts: {
  mes?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
}): ListSolicitudesAdminParams {
  const params: ListSolicitudesAdminParams = {};

  if (opts.estado && opts.estado !== "all") {
    params.estado = opts.estado as ListSolicitudesAdminParams["estado"];
  }

  if (opts.mes && opts.mes !== "all") {
    const [y, m] = opts.mes.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    params.fecha_desde = start.toISOString();
    params.fecha_hasta = end.toISOString();
  } else {
    if (opts.fechaDesde) {
      params.fecha_desde = new Date(`${opts.fechaDesde}T00:00:00`).toISOString();
    }
    if (opts.fechaHasta) {
      params.fecha_hasta = new Date(`${opts.fechaHasta}T23:59:59`).toISOString();
    }
  }

  return params;
}

/** Empresas únicas derivadas del listado API (filtro empresa en cliente). */
export function empresasFromAdelantos(adelantos: Adelanto[]): Empresa[] {
  const map = new Map<string, Empresa>();
  for (const a of adelantos) {
    if (map.has(a.empresaId)) continue;
    map.set(a.empresaId, {
      id: a.empresaId,
      nombre: a.empresaNombre ?? "—",
      nit: a.empresaNit ?? "—",
      adminNombre: "",
      adminEmail: "",
      adminPassword: "",
      activa: true,
      createdAt: a.fechaSolicitud,
    });
  }
  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function filterAdelantosClient(
  adelantos: Adelanto[],
  opts: {
    mes?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    empresaId?: string;
    estado?: string;
    defaultEstados?: EstadoAdelanto[];
  },
): Adelanto[] {
  return adelantos.filter((a) => {
    if (opts.mes && opts.mes !== "all" && monthKey(a.fechaSolicitud) !== opts.mes) return false;
    if (opts.empresaId && opts.empresaId !== "all" && a.empresaId !== opts.empresaId) return false;
    if (opts.estado && opts.estado !== "all") {
      if (a.estado !== opts.estado) return false;
    } else if (opts.defaultEstados && !opts.defaultEstados.includes(a.estado)) {
      return false;
    }
    return true;
  });
}
