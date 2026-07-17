import type { Adelanto, Empleado, TipoContrato, TipoDocumento } from "@/lib/admin-store";
import { getMediaUrl } from "@/lib/api/config";
import type { EmpleadoAdminApi, SolicitudHistorialAdminItem } from "@/lib/api/types";

function mapTipoDocumento(tipo: string): TipoDocumento {
  const t = tipo.toLowerCase();
  if (t === "ce") return "CE";
  if (t === "ppt" || t === "pas" || t === "ti") return "PPT";
  return "CC";
}

function mapTipoCuenta(tipo: string): "Ahorros" | "Corriente" {
  return tipo.toLowerCase() === "corriente" ? "Corriente" : "Ahorros";
}

function mapTipoContrato(tipo: string): TipoContrato {
  switch (tipo.toLowerCase()) {
    case "fijo":
      return "Término Fijo";
    case "aprendizaje":
      return "Aprendizaje";
    case "obra_labor":
      return "Obra o labor";
    case "prestacion_servicios":
      return "Obra o labor";
    case "indefinido":
    default:
      return "Término Indefinido";
  }
}

export type NominaEmpleado = Empleado & {
  saldoDisponibleApi?: number;
  estado?: string;
  fechaIngreso?: string;
};

export function empleadoAdminToNomina(e: EmpleadoAdminApi): NominaEmpleado {
  return {
    id: e.id,
    empresaId: e.empresa_id,
    nombre: e.nombre,
    tipoDocumento: mapTipoDocumento(e.tipo_documento),
    documento: e.documento,
    salario: Number(e.salario) || 0,
    banco: e.banco_nombre?.trim() || "—",
    numeroCuenta: e.numero_cuenta,
    tipoCuenta: mapTipoCuenta(e.tipo_cuenta),
    email: e.email_empleado,
    celular: e.celular,
    tipoContrato: mapTipoContrato(e.tipo_contrato),
    saldoDisponibleApi: Number(e.saldo_disponible) || 0,
    estado: e.estado,
    fechaIngreso: e.fecha_ingreso,
  };
}

export function historialItemToAdelanto(s: SolicitudHistorialAdminItem): Adelanto {
  return {
    id: s.id,
    empresaId: s.empresa_id,
    empresaNombre: s.empresa_nombre,
    empresaNit: s.empresa_nit,
    empleadoNombre: s.empleado_nombre,
    empleadoCedula: s.empleado_documento,
    monto: Number(s.monto) || 0,
    montoNeto: Number(s.monto_neto) > 0 ? Number(s.monto_neto) : undefined,
    numeroCuotas: s.numero_cuotas_snapshot,
    fechaSolicitud: s.created_at ?? new Date().toISOString(),
    estado: s.estado,
    cuenta: {
      banco: s.banco_nombre?.trim() || "—",
      tipo: mapTipoCuenta(s.tipo_cuenta ?? "ahorros"),
      numero: s.numero_cuenta?.trim() || "—",
    },
    comprobanteUrl: s.comprobante_pago_url
      ? (getMediaUrl(s.comprobante_pago_url) ?? s.comprobante_pago_url)
      : undefined,
    fechaPago: s.pagado_en ?? undefined,
    motivoRechazo: s.motivo_rechazo ?? undefined,
  };
}
