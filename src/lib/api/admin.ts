import { apiRequest } from "./client";
import type {
  AuditoriaIndicadoresApi,
  ControlPagoEmpresaApi,
  CrearCuentaCobroPayload,
  CuentaCobroApi,
  HistorialAdelantosAdminResponse,
  ListAuditoriaParams,
  ListControlPagosParams,
  ListCuentasCobroParams,
  ListHistorialAdelantosParams,
  ListadoAuditoriaApi,
} from "./types";

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Resumen mensual de cobros por empresa. `mes` y `anio` son obligatorios. */
export function getControlPagos(params: ListControlPagosParams) {
  return apiRequest<ControlPagoEmpresaApi[]>(
    `/admin/control-pagos/${buildQuery({
      mes: params.mes,
      anio: params.anio,
      empresa_id: params.empresa_id,
    })}`,
    { auth: true },
  );
}

export function listCuentasCobro(params?: ListCuentasCobroParams) {
  return apiRequest<CuentaCobroApi[]>(
    `/admin/cuentas-cobro/${buildQuery({
      periodo: params?.periodo,
      empresa_id: params?.empresa_id,
    })}`,
    { auth: true },
  );
}

export function crearCuentaCobro(payload: CrearCuentaCobroPayload) {
  return apiRequest<CuentaCobroApi>(`/admin/cuentas-cobro/`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function getCuentaCobro(cuentaId: string) {
  return apiRequest<CuentaCobroApi>(`/admin/cuentas-cobro/${cuentaId}/`, {
    auth: true,
  });
}

export function adjuntarDocumentoCobro(cuentaId: string, documento: File) {
  const formData = new FormData();
  formData.append("documento", documento);
  return apiRequest<CuentaCobroApi>(`/admin/cuentas-cobro/${cuentaId}/documento/`, {
    method: "POST",
    auth: true,
    body: formData,
  });
}

export function registrarEvidenciaCobro(cuentaId: string, evidencia: File) {
  const formData = new FormData();
  formData.append("evidencia", evidencia);
  return apiRequest<CuentaCobroApi>(`/admin/cuentas-cobro/${cuentaId}/evidencia/`, {
    method: "POST",
    auth: true,
    body: formData,
  });
}

export function verificarCuentaCobro(cuentaId: string) {
  return apiRequest<CuentaCobroApi>(`/admin/cuentas-cobro/${cuentaId}/verificar/`, {
    method: "POST",
    auth: true,
  });
}

export function rechazarEvidenciaCobro(cuentaId: string, notaRevision: string) {
  return apiRequest<CuentaCobroApi>(`/admin/cuentas-cobro/${cuentaId}/rechazar/`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ nota_revision: notaRevision }),
  });
}

export function listAuditoria(params?: ListAuditoriaParams) {
  return apiRequest<ListadoAuditoriaApi>(
    `/admin/auditoria/${buildQuery(params)}`,
    { auth: true },
  );
}

export function getAuditoriaIndicadores(params?: Pick<ListAuditoriaParams, "fecha_desde" | "fecha_hasta">) {
  return apiRequest<AuditoriaIndicadoresApi>(
    `/admin/auditoria/indicadores/${buildQuery(params)}`,
    { auth: true },
  );
}

export function getHistorialAdelantosAdmin(params?: ListHistorialAdelantosParams) {
  return apiRequest<HistorialAdelantosAdminResponse>(
    `/admin/adelantos/historial/${buildQuery(params)}`,
    { auth: true },
  );
}
