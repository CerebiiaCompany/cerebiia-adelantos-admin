import { apiRequest } from "./client";
import type {
  CuotaAdelantoApi,
  RechazarSolicitudPayload,
  SolicitudAdminApi,
  SolicitudAdelantoApi,
} from "./types";

const ADMIN = "/adelantos/admin/solicitudes";

export function listSolicitudesAdmin() {
  return apiRequest<SolicitudAdminApi[]>(`${ADMIN}/`, { auth: true });
}

export function getSolicitudAdmin(solicitudId: string) {
  return apiRequest<SolicitudAdminApi>(`${ADMIN}/${solicitudId}/`, { auth: true });
}

export function marcarEnRevision(solicitudId: string) {
  return apiRequest<SolicitudAdelantoApi>(`${ADMIN}/${solicitudId}/en-revision/`, {
    method: "POST",
    auth: true,
  });
}

export function rechazarSolicitud(solicitudId: string, payload: RechazarSolicitudPayload) {
  return apiRequest<SolicitudAdelantoApi>(`${ADMIN}/${solicitudId}/rechazar/`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function subirComprobantePago(solicitudId: string, comprobante: File) {
  const formData = new FormData();
  formData.append("comprobante", comprobante);
  return apiRequest<SolicitudAdelantoApi>(`${ADMIN}/${solicitudId}/comprobante/`, {
    method: "POST",
    auth: true,
    body: formData,
  });
}

export function aprobarSolicitud(solicitudId: string) {
  return apiRequest<SolicitudAdelantoApi>(`/adelantos/solicitudes/${solicitudId}/aprobar/`, {
    method: "POST",
    auth: true,
  });
}

export function listCuotasSolicitud(solicitudId: string) {
  return apiRequest<CuotaAdelantoApi[]>(`/adelantos/solicitudes/${solicitudId}/cuotas/`, {
    auth: true,
  });
}

export function pagarCuota(cuotaId: string) {
  return apiRequest<CuotaAdelantoApi>(`/adelantos/cuotas/${cuotaId}/pagar/`, {
    method: "POST",
    auth: true,
  });
}
