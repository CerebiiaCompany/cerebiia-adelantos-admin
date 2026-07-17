import { apiRequest } from "./client";
import type {
  CuotaAdelantoApi,
  DashboardAdelantosApi,
  EmpleadosMetricasApi,
  ListSolicitudesAdminParams,
  PaginatedResponse,
  RechazarSolicitudPayload,
  SolicitudAdminApi,
  SolicitudAdminListItem,
  SolicitudAdelantoApi,
  SolicitudDetalleResponse,
} from "./types";

const ADMIN_SOLICITUDES = "/adelantos/admin/solicitudes";
const SOLICITUDES = "/adelantos/solicitudes";

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function getDashboardAdelantos(params?: { mes?: number; anio?: number }) {
  return apiRequest<DashboardAdelantosApi>(
    `/adelantos/admin/dashboard/${buildQuery({
      mes: params?.mes,
      anio: params?.anio,
    })}`,
    { auth: true },
  );
}

export function listSolicitudesAdmin(params?: ListSolicitudesAdminParams) {
  return apiRequest<PaginatedResponse<SolicitudAdminListItem>>(
    `${ADMIN_SOLICITUDES}/${buildQuery(params)}`,
    { auth: true },
  );
}

export function getSolicitudAdmin(solicitudId: string) {
  return apiRequest<SolicitudAdminApi>(`${ADMIN_SOLICITUDES}/${solicitudId}/`, { auth: true });
}

export function getSolicitudDetalle(solicitudId: string) {
  return apiRequest<SolicitudDetalleResponse>(`${SOLICITUDES}/${solicitudId}/`, { auth: true });
}

export function marcarEnRevision(solicitudId: string) {
  return apiRequest<SolicitudAdelantoApi>(`${ADMIN_SOLICITUDES}/${solicitudId}/en-revision/`, {
    method: "POST",
    auth: true,
  });
}

export function revisarSolicitud(solicitudId: string) {
  return apiRequest<SolicitudAdelantoApi>(`${SOLICITUDES}/${solicitudId}/revisar/`, {
    method: "POST",
    auth: true,
  });
}

export function rechazarSolicitudAdmin(solicitudId: string, payload: RechazarSolicitudPayload) {
  return apiRequest<SolicitudAdelantoApi>(`${ADMIN_SOLICITUDES}/${solicitudId}/rechazar/`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function rechazarSolicitud(solicitudId: string) {
  return apiRequest<SolicitudAdelantoApi>(`${SOLICITUDES}/${solicitudId}/rechazar/`, {
    method: "POST",
    auth: true,
  });
}

export function subirComprobantePago(solicitudId: string, comprobante: File) {
  const formData = new FormData();
  formData.append("comprobante", comprobante);
  return apiRequest<SolicitudAdelantoApi>(`${ADMIN_SOLICITUDES}/${solicitudId}/comprobante/`, {
    method: "POST",
    auth: true,
    body: formData,
  });
}

export function pagarSolicitud(solicitudId: string, comprobantePagoUrl: string) {
  return apiRequest<SolicitudAdelantoApi>(`${SOLICITUDES}/${solicitudId}/pagar/`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ comprobante_pago_url: comprobantePagoUrl }),
  });
}

export function aprobarSolicitud(solicitudId: string) {
  return apiRequest<SolicitudAdelantoApi>(`${SOLICITUDES}/${solicitudId}/aprobar/`, {
    method: "POST",
    auth: true,
  });
}

export function listCuotasSolicitud(solicitudId: string) {
  return apiRequest<CuotaAdelantoApi[]>(`${SOLICITUDES}/${solicitudId}/cuotas/`, {
    auth: true,
  });
}

export function pagarCuota(cuotaId: string) {
  return apiRequest<CuotaAdelantoApi>(`/adelantos/cuotas/${cuotaId}/pagar/`, {
    method: "POST",
    auth: true,
  });
}

export function getEmpleadosMetricas() {
  return apiRequest<EmpleadosMetricasApi>("/empleados/admin/metricas/", { auth: true });
}
