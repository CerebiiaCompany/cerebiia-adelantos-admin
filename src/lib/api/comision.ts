import { apiRequest } from "./client";
import type { Comision, UpdateComisionPayload } from "./types";

/**
 * Contrato esperado del backend:
 * GET  /comision/ → { valor_comision: string, updated_at: string }
 * POST /comision/ → body { valor_comision: string } → mismo response
 *
 * valor_comision: monto fijo en COP (entero) cobrado por cada adelanto procesado.
 */

type ComisionApiResponse = Comision & { porcentaje_comision?: string };

export function normalizeComision(data: ComisionApiResponse): Comision {
  return {
    valor_comision: data.valor_comision ?? data.porcentaje_comision ?? "0",
    updated_at: data.updated_at,
  };
}

export async function getComision() {
  const data = await apiRequest<ComisionApiResponse>("/comision/", { auth: true });
  return normalizeComision(data);
}

export async function updateComision(payload: UpdateComisionPayload) {
  const data = await apiRequest<ComisionApiResponse>("/comision/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return normalizeComision(data);
}
