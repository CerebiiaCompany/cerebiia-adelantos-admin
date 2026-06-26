import type { Adelanto } from "@/lib/admin-store";
import { getMediaUrl } from "@/lib/api/config";
import type { SolicitudAdminApi } from "@/lib/api/types";

export function solicitudAdminToAdelanto(s: SolicitudAdminApi): Adelanto {
  return {
    id: s.id,
    empresaId: s.empresa.id,
    empresaNombre: s.empresa.nombre,
    empresaNit: s.empresa.nit,
    empleadoNombre: s.empleado.nombre,
    empleadoCedula: s.empleado.documento,
    monto: Number(s.monto),
    montoNeto: Number(s.monto_neto) > 0 ? Number(s.monto_neto) : undefined,
    numeroCuotas: s.numero_cuotas_snapshot,
    fechaSolicitud: s.created_at,
    estado: s.estado,
    cuenta: {
      banco: "—",
      tipo: "Ahorros",
      numero: "—",
    },
    motivoRechazo: s.motivo_rechazo ?? undefined,
    comprobanteUrl: getMediaUrl(s.comprobante_pago) ?? undefined,
    fechaPago: s.estado === "pagado" ? s.created_at : undefined,
  };
}

export function solicitudesAdminToAdelantos(list: SolicitudAdminApi[]): Adelanto[] {
  return list.map(solicitudAdminToAdelanto);
}
