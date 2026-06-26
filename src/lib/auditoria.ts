import { getStoredUser } from "@/lib/auth-storage";

export const AUDITORIA_STORAGE_KEY = "lov_admin_auditoria_v1";
const MAX_REGISTROS = 500;

export type EstadoAdelantoAuditoria =
  | "solicitado"
  | "en_revision"
  | "aprobado"
  | "pagado"
  | "rechazado";

export type AccionAuditoria =
  | "paso_revision"
  | "aprobacion"
  | "rechazo"
  | "pago_confirmado";

export type RegistroAuditoria = {
  id: string;
  adelantoId: string;
  empresaId: string;
  empleadoNombre: string;
  empleadoCedula: string;
  monto: number;
  estadoAnterior: EstadoAdelantoAuditoria;
  estadoNuevo: EstadoAdelantoAuditoria;
  accion: AccionAuditoria;
  actorId: string;
  actorNombre: string;
  actorEmail: string;
  detalle?: string;
  timestamp: string;
};

export type AdelantoAuditoriaInput = {
  id: string;
  empresaId: string;
  empleadoNombre: string;
  empleadoCedula: string;
  monto: number;
  estado: EstadoAdelantoAuditoria;
};

export const accionAuditoriaLabel: Record<AccionAuditoria, string> = {
  paso_revision: "Pasó a revisión",
  aprobacion: "Aprobó solicitud",
  rechazo: "Rechazó solicitud",
  pago_confirmado: "Confirmó pago",
};

export const ACCION_AUDITORIA_BADGE: Record<AccionAuditoria, string> = {
  paso_revision: "bg-warning/15 text-warning border-warning/30",
  aprobacion: "bg-primary/15 text-primary border-primary/30",
  rechazo: "bg-destructive/15 text-destructive border-destructive/30",
  pago_confirmado: "bg-success/15 text-success border-success/30",
};

export function resolverAccion(
  estadoAnterior: EstadoAdelantoAuditoria,
  estadoNuevo: EstadoAdelantoAuditoria,
): AccionAuditoria | null {
  if (estadoAnterior === estadoNuevo) return null;
  if (estadoNuevo === "en_revision") return "paso_revision";
  if (estadoNuevo === "aprobado") return "aprobacion";
  if (estadoNuevo === "rechazado") return "rechazo";
  if (estadoNuevo === "pagado") return "pago_confirmado";
  return null;
}

export function leerAuditorias(): RegistroAuditoria[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDITORIA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RegistroAuditoria[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistAuditorias(registros: RegistroAuditoria[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUDITORIA_STORAGE_KEY, JSON.stringify(registros.slice(0, MAX_REGISTROS)));
}

export function appendAuditoria(
  input: Omit<
    RegistroAuditoria,
    "id" | "timestamp" | "actorId" | "actorNombre" | "actorEmail"
  >,
): RegistroAuditoria {
  const user = getStoredUser();
  const registro: RegistroAuditoria = {
    ...input,
    id: `aud${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorId: user?.id ?? "local",
    actorNombre: user?.full_name?.trim() || "Super Admin",
    actorEmail: user?.email ?? "—",
  };
  persistAuditorias([registro, ...leerAuditorias()]);
  return registro;
}

export function registrarAuditoriaAdelanto(
  adelanto: AdelantoAuditoriaInput,
  estadoNuevo: EstadoAdelantoAuditoria,
  detalle?: string,
): RegistroAuditoria | null {
  const accion = resolverAccion(adelanto.estado, estadoNuevo);
  if (!accion) return null;

  return appendAuditoria({
    adelantoId: adelanto.id,
    empresaId: adelanto.empresaId,
    empleadoNombre: adelanto.empleadoNombre,
    empleadoCedula: adelanto.empleadoCedula,
    monto: adelanto.monto,
    estadoAnterior: adelanto.estado,
    estadoNuevo,
    accion,
    detalle: detalle?.trim() || undefined,
  });
}
