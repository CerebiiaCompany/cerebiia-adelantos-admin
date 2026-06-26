import {
  aprobarSolicitud,
  listCuotasSolicitud,
  listSolicitudesAdmin,
  marcarEnRevision,
  pagarCuota,
  rechazarSolicitud,
  subirComprobantePago,
} from "@/lib/api/adelantos";
import { getMediaUrl } from "@/lib/api/config";
import { isBackendUuid } from "@/lib/api/is-api-id";
import { solicitudesAdminToAdelantos } from "@/lib/adelantos-mapper";
import type { Adelanto } from "@/lib/admin-store";

/** Sincroniza aprobación con el backend. Retorna false si el id es demo local. */
export async function syncAprobarSolicitud(solicitudId: string): Promise<boolean> {
  if (!isBackendUuid(solicitudId)) return false;
  await aprobarSolicitud(solicitudId);
  return true;
}

/** Marca solicitud como en revisión en el backend. */
export async function syncMarcarEnRevision(solicitudId: string): Promise<boolean> {
  if (!isBackendUuid(solicitudId)) return false;
  await marcarEnRevision(solicitudId);
  return true;
}

/** Rechaza solicitud en el backend con motivo. */
export async function syncRechazarSolicitud(
  solicitudId: string,
  motivoRechazo: string,
): Promise<boolean> {
  if (!isBackendUuid(solicitudId)) return false;
  await rechazarSolicitud(solicitudId, { motivo_rechazo: motivoRechazo });
  return true;
}

/** Sube comprobante de desembolso al empleado. Retorna URL pública del comprobante. */
export async function syncSubirComprobante(
  solicitudId: string,
  file: File,
): Promise<string | null> {
  if (!isBackendUuid(solicitudId)) return null;
  const res = await subirComprobantePago(solicitudId, file);
  return getMediaUrl(res.comprobante_pago) ?? file.name;
}

/** Paga todas las cuotas pendientes de nómina de una solicitud en el backend. */
export async function syncPagarCuotasSolicitud(solicitudId: string): Promise<boolean> {
  if (!isBackendUuid(solicitudId)) return false;
  const cuotas = await listCuotasSolicitud(solicitudId);
  const pendientes = cuotas.filter((c) => c.estado === "pendiente");
  for (const cuota of pendientes) {
    await pagarCuota(cuota.id);
  }
  return true;
}

/** Carga solicitudes del backend y las mapea al modelo UI. */
export async function fetchAdelantosFromApi(): Promise<Adelanto[]> {
  const solicitudes = await listSolicitudesAdmin();
  return solicitudesAdminToAdelantos(solicitudes);
}
