import { apiRequest } from "./client";
import type {
  ConfiguracionGlobal,
  HistorialConfiguracion,
  UpdateConfiguracionPayload,
} from "./types";

export function getConfiguracion() {
  return apiRequest<ConfiguracionGlobal>("/configuracion/", { auth: true });
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
