import { aprobarSolicitud, listCuotasSolicitud, pagarCuota } from "@/lib/api/adelantos";
import { isBackendUuid } from "@/lib/api/is-api-id";

/** Sincroniza aprobación con el backend. Retorna false si el id es demo local. */
export async function syncAprobarSolicitud(solicitudId: string): Promise<boolean> {
  if (!isBackendUuid(solicitudId)) return false;
  await aprobarSolicitud(solicitudId);
  return true;
}

/** Paga todas las cuotas pendientes de una solicitud en el backend. */
export async function syncPagarCuotasSolicitud(solicitudId: string): Promise<boolean> {
  if (!isBackendUuid(solicitudId)) return false;
  const cuotas = await listCuotasSolicitud(solicitudId);
  const pendientes = cuotas.filter((c) => c.estado === "pendiente");
  for (const cuota of pendientes) {
    await pagarCuota(cuota.id);
  }
  return true;
}
