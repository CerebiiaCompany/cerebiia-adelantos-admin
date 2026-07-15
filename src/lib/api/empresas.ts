import { apiRequest } from "./client";
import type {
  ApiEmpresa,
  CreateEmpresaPayload,
  EmpresaListItem,
  ListEmpresasParams,
  ReactivarEmpresaResponse,
  SuspenderEmpresaResponse,
} from "./types";

function buildQuery(params?: ListEmpresasParams): string {
  if (!params || params.mes == null || params.anio == null) return "";
  const q = new URLSearchParams({
    mes: String(params.mes),
    anio: String(params.anio),
  });
  return `?${q}`;
}

/** Listado real de empresas (no existe `GET /empresas/`). */
export function listarEmpresas(params?: ListEmpresasParams) {
  return apiRequest<EmpresaListItem[]>(`/empresas/listar/${buildQuery(params)}`, {
    auth: true,
  });
}

export function createEmpresa(payload: CreateEmpresaPayload) {
  return apiRequest<ApiEmpresa>("/empresas/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function reactivarEmpresa(empresaId: string) {
  return apiRequest<ReactivarEmpresaResponse>(`/empresas/${empresaId}/reactivar/`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({}),
  });
}

export function suspenderEmpresa(empresaId: string) {
  return apiRequest<SuspenderEmpresaResponse>(`/empresas/${empresaId}/suspender/`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({}),
  });
}
