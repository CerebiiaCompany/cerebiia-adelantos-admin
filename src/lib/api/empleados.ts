import { apiRequest } from "./client";
import type {
  EmpleadoAdminApi,
  ListadoEmpleadosAdminApi,
  ListEmpleadosAdminParams,
} from "./types";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Nómina paginada (super_admin). Sin `empresa_id` = todas las empresas. */
export function listarEmpleadosAdmin(params: ListEmpleadosAdminParams = {}) {
  return apiRequest<ListadoEmpleadosAdminApi>(
    `/empleados/admin/${buildQuery({
      empresa_id: params.empresa_id,
      page: params.page,
      page_size: params.page_size,
      nombre: params.nombre,
      email: params.email,
      documento: params.documento,
      estado: params.estado,
    })}`,
    { auth: true },
  );
}

/** Trae todos los empleados (recorre páginas). Sin filtro de estado = todos. */
export async function listarTodosEmpleadosAdmin(
  params: Omit<ListEmpleadosAdminParams, "page" | "page_size"> = {},
): Promise<EmpleadoAdminApi[]> {
  const pageSize = 100;
  let page = 1;
  const all: EmpleadoAdminApi[] = [];

  for (;;) {
    const batch = await listarEmpleadosAdmin({
      ...params,
      page,
      page_size: pageSize,
    });
    all.push(...batch.results);
    if (!batch.next || batch.results.length === 0) break;
    page = batch.next;
  }

  return all;
}

/** Trae toda la nómina de la empresa (recorre páginas). */
export async function listarTodaNominaEmpresa(empresaId: string): Promise<EmpleadoAdminApi[]> {
  return listarTodosEmpleadosAdmin({ empresa_id: empresaId });
}
