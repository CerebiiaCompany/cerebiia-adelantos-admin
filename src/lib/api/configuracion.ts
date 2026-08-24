import { apiRequest } from "./client";
import type {
  ConfiguracionGlobal,
  ConfiguracionPersonalizada,
  HistorialConfiguracion,
  SaveConfiguracionPersonalizadaPayload,
  UpdateConfiguracionPayload,
} from "./types";

export function getConfiguracion(empresaId?: string) {
  const query = empresaId ? `?empresa_id=${encodeURIComponent(empresaId)}` : "";
  return apiRequest<ConfiguracionGlobal>(`/configuracion/${query}`, { auth: true });
}

export function updateConfiguracion(payload: UpdateConfiguracionPayload) {
  return apiRequest<ConfiguracionGlobal>("/configuracion/", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function getConfiguracionHistorial() {
  return apiRequest<HistorialConfiguracion[]>("/configuracion/historial/", { auth: true });
}

export function getConfiguracionesPersonalizadas(empresaId?: string) {
  const query = empresaId ? `?empresa_id=${encodeURIComponent(empresaId)}` : "";
  return apiRequest<ConfiguracionPersonalizada[]>(`/configuracion/personalizadas/${query}`, {
    auth: true,
  });
}

export function saveConfiguracionPersonalizada(payload: SaveConfiguracionPersonalizadaPayload) {
  return apiRequest<ConfiguracionPersonalizada>("/configuracion/personalizadas/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteConfiguracionPersonalizada(configId: string) {
  return apiRequest<void>(`/configuracion/personalizadas/${encodeURIComponent(configId)}/`, {
    method: "DELETE",
    auth: true,
  });
}
