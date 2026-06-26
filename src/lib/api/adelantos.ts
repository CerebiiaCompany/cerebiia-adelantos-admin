import { apiRequest } from "./client";
import type { CuotaAdelantoApi, SolicitudAdelantoApi } from "./types";

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
