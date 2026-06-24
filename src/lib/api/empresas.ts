import { apiRequest } from "./client";
import type { ApiEmpresa, CreateEmpresaPayload } from "./types";

export function createEmpresa(payload: CreateEmpresaPayload) {
  return apiRequest<ApiEmpresa>("/empresas/", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}
