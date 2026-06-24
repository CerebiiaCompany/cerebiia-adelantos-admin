import { apiRequest } from "./client";
import type { Comision, UpdateComisionPayload } from "./types";

/**
 * Contrato esperado del backend (pendiente de implementación):
 * GET  /comision/ → { porcentaje_comision: string, updated_at: string }
 * POST /comision/ → body { porcentaje_comision: string } → mismo response
 */

export function getComision() {
  return apiRequest<Comision>("/comision/", { auth: true });
}

export function updateComision(payload: UpdateComisionPayload) {
  return apiRequest<Comision>("/comision/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}
