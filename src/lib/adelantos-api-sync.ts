import {
  aprobarSolicitud,
  getSolicitudDetalle,
  listCuotasSolicitud,
  listSolicitudesAdmin,
  marcarEnRevision,
  pagarCuota,
  rechazarSolicitudAdmin,
  subirComprobantePago,
} from "@/lib/api/adelantos";
import { isBackendUuid } from "@/lib/api/is-api-id";
import { resolveComprobanteUrl, solicitudesListToAdelantos } from "@/lib/adelantos-mapper";
import type { Adelanto } from "@/lib/admin-store";
import type { CuotaAdelantoApi, ListSolicitudesAdminParams } from "@/lib/api/types";

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

/** Rechaza solicitud en el backend con motivo (endpoint admin). */
export async function syncRechazarSolicitud(
  solicitudId: string,
  motivoRechazo: string,
): Promise<boolean> {
  if (!isBackendUuid(solicitudId)) return false;
  await rechazarSolicitudAdmin(solicitudId, { motivo_rechazo: motivoRechazo });
  return true;
}

/** Sube comprobante de desembolso al empleado. Retorna URL pública del comprobante. */
export async function syncSubirComprobante(
  solicitudId: string,
  file: File,
): Promise<string | null> {
  if (!isBackendUuid(solicitudId)) return null;
  const res = await subirComprobantePago(solicitudId, file);
  return resolveComprobanteUrl(res.comprobante_pago_url, res.comprobante_pago) ?? file.name;
}

/** Marca una cuota de nómina como pagada en el backend. */
export async function syncPagarCuota(cuotaId: string): Promise<boolean> {
  if (!isBackendUuid(cuotaId)) return false;
  await pagarCuota(cuotaId);
  return true;
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

/** @deprecated Prefer useSolicitudesAdmin (paginado). Solo para exports/jobs offline. */
export async function fetchAdelantosFromApi(
  params?: Omit<ListSolicitudesAdminParams, "page" | "page_size">,
): Promise<Adelanto[]> {
  const all: Adelanto[] = [];
  let page = 1;
  const page_size = 100;

  for (;;) {
    const res = await listSolicitudesAdmin({ ...params, page, page_size });
    all.push(...solicitudesListToAdelantos(res.results));
    if (!res.next) break;
    page += 1;
  }

  return all;
}

/** Detalle con cuotas para diálogos admin. */
export async function fetchCuotasSolicitud(solicitudId: string): Promise<CuotaAdelantoApi[]> {
  if (!isBackendUuid(solicitudId)) return [];
  const detalle = await getSolicitudDetalle(solicitudId);
  return detalle.cuotas;
}
