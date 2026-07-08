import type { Adelanto } from "@/lib/admin-store";
import { getMediaUrl } from "@/lib/api/config";
import type {
  SolicitudAdminApi,
  SolicitudAdminListItem,
  SolicitudAdelantoApi,
} from "@/lib/api/types";

function mapTipoCuenta(tipo: string | null | undefined): "Ahorros" | "Corriente" {
  if (!tipo) return "Ahorros";
  return tipo.toLowerCase() === "corriente" ? "Corriente" : "Ahorros";
}

export function resolveComprobanteUrl(
  url: string | null | undefined,
  legacyPath?: string | null,
): string | undefined {
  const raw = url ?? legacyPath;
  if (!raw) return undefined;
  return getMediaUrl(raw) ?? raw;
}

function baseAdelantoFields(
  id: string,
  empresaId: string,
  empresaNombre: string,
  empresaNit: string | undefined,
  empleadoNombre: string,
  empleadoCedula: string,
  monto: string,
  montoNeto: string,
  numeroCuotas: number,
  estado: Adelanto["estado"],
  createdAt: string,
  cuenta: Adelanto["cuenta"],
  extras?: Partial<Adelanto>,
): Adelanto {
  return {
    id,
    empresaId,
    empresaNombre,
    empresaNit,
    empleadoNombre,
    empleadoCedula,
    monto: Number(monto),
    montoNeto: Number(montoNeto) > 0 ? Number(montoNeto) : undefined,
    numeroCuotas,
    fechaSolicitud: createdAt,
    estado,
    cuenta,
    ...extras,
  };
}

export function solicitudListItemToAdelanto(s: SolicitudAdminListItem): Adelanto {
  return baseAdelantoFields(
    s.id,
    s.empresa_id,
    s.empresa_nombre,
    s.empresa_nit,
    s.empleado_nombre,
    s.empleado_documento,
    s.monto,
    s.monto_neto,
    s.numero_cuotas_snapshot,
    s.estado,
    s.created_at,
    {
      banco: s.banco_nombre?.trim() || "—",
      tipo: mapTipoCuenta(s.tipo_cuenta),
      numero: s.numero_cuenta?.trim() || "—",
    },
    {
      comprobanteUrl: resolveComprobanteUrl(s.comprobante_pago_url),
      fechaPago: s.pagado_en ?? undefined,
    },
  );
}

export function solicitudAdminToAdelanto(s: SolicitudAdminApi): Adelanto {
  return baseAdelantoFields(
    s.id,
    s.empresa.id,
    s.empresa.nombre,
    s.empresa.nit,
    s.empleado.nombre,
    s.empleado.documento,
    s.monto,
    s.monto_neto,
    s.numero_cuotas_snapshot,
    s.estado,
    s.created_at,
    { banco: "—", tipo: "Ahorros", numero: "—" },
    {
      motivoRechazo: s.motivo_rechazo ?? undefined,
      comprobanteUrl: resolveComprobanteUrl(null, s.comprobante_pago),
    },
  );
}

export function solicitudApiToAdelanto(s: SolicitudAdelantoApi): Adelanto {
  return baseAdelantoFields(
    s.id,
    s.empresa_id,
    "",
    undefined,
    "",
    "",
    s.monto,
    s.monto_neto,
    s.numero_cuotas_snapshot,
    s.estado,
    s.created_at,
    { banco: "—", tipo: "Ahorros", numero: "—" },
    {
      motivoRechazo: s.motivo_rechazo ?? undefined,
      comprobanteUrl: resolveComprobanteUrl(s.comprobante_pago_url, s.comprobante_pago),
      fechaPago: s.pagado_en ?? undefined,
    },
  );
}

export function solicitudesListToAdelantos(list: SolicitudAdminListItem[]): Adelanto[] {
  return list.map(solicitudListItemToAdelanto);
}

/** @deprecated Usar solicitudesListToAdelantos */
export const solicitudesAdminToAdelantos = solicitudesListToAdelantos;
