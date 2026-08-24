import { apiRequest } from "./client";

export interface LogroAdmin {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  puntos: number;
  icon_key: string;
  regla: "primera_vez" | "adelanto_count" | "manual" | string;
  umbral: number | null;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface CrearLogroPayload {
  codigo: string;
  titulo: string;
  descripcion: string;
  puntos: number;
  icon_key?: string;
  regla: "primera_vez" | "adelanto_count" | "manual";
  umbral?: number | null;
  activo?: boolean;
  orden?: number;
}

export interface ActualizarLogroPayload {
  titulo?: string;
  descripcion?: string;
  puntos?: number;
  icon_key?: string;
  regla?: "primera_vez" | "adelanto_count" | "manual";
  umbral?: number | null;
  activo?: boolean;
  orden?: number;
}

export function listLogros() {
  return apiRequest<LogroAdmin[]>("/logros/", { auth: true });
}

export function createLogro(payload: CrearLogroPayload) {
  return apiRequest<LogroAdmin>("/logros/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function updateLogro(id: string, payload: ActualizarLogroPayload) {
  return apiRequest<LogroAdmin>(`/logros/${id}/`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteLogro(id: string, hard = false) {
  const path = hard ? `/logros/${id}/?hard=true` : `/logros/${id}/`;
  return apiRequest<LogroAdmin | void>(path, {
    method: "DELETE",
    auth: true,
  });
}
