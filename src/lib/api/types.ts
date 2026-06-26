export const SUPER_ADMIN_ROLE = "super_admin" as const;

export type UserRole = "super_admin" | "empresa" | "empleado";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type AuthUser = User;

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshResponse {
  access: string;
  refresh: string;
}

export interface CreateUserPayload {
  email: string;
  full_name: string;
  password: string;
  role?: "empleado";
}

export interface CreateEmpresaPayload {
  nombre: string;
  nit: string;
  email: string;
  password: string;
  full_name: string;
}

export interface ApiEmpresa {
  id: string;
  nombre: string;
  nit: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracionGlobal {
  porcentaje_maximo_adelanto: string;
  numero_maximo_cuotas: number;
  plazo_maximo_dias: number;
  tarifa_fija_por_cuota: string;
  updated_at: string;
}

export interface UpdateConfiguracionPayload {
  porcentaje_maximo_adelanto: string;
  numero_maximo_cuotas: number;
  plazo_maximo_dias: number;
  tarifa_fija_por_cuota: string;
}

export interface HistorialConfiguracion {
  id: string;
  porcentaje_maximo_adelanto: string;
  numero_maximo_cuotas: number;
  plazo_maximo_dias: number;
  tarifa_fija_por_cuota: string;
  actualizado_por: string | null;
  timestamp: string;
}

export type EstadoSolicitudApi =
  | "solicitado"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "pagado";

export type EstadoCuotaApi = "pendiente" | "pagada";

export interface SolicitudAdelantoApi {
  id: string;
  empleado_id: string;
  empresa_id: string;
  monto: string;
  monto_neto: string;
  numero_cuotas_snapshot: number;
  plazo_dias_snapshot: number;
  estado: EstadoSolicitudApi;
  motivo_rechazo?: string | null;
  comprobante_pago?: string | null;
  created_at: string;
}

export interface SolicitudAdminEmpleado {
  id: string;
  nombre: string;
  documento: string;
}

export interface SolicitudAdminEmpresa {
  id: string;
  nombre: string;
  nit: string;
}

export interface SolicitudAdminApi {
  id: string;
  monto: string;
  monto_neto: string;
  numero_cuotas_snapshot: number;
  plazo_dias_snapshot: number;
  estado: EstadoSolicitudApi;
  motivo_rechazo: string | null;
  comprobante_pago: string | null;
  created_at: string;
  empleado: SolicitudAdminEmpleado;
  empresa: SolicitudAdminEmpresa;
}

export interface RechazarSolicitudPayload {
  motivo_rechazo: string;
}

export interface CuotaAdelantoApi {
  id: string;
  solicitud_id: string;
  numero: number;
  monto: string;
  fecha_corte: string;
  estado: EstadoCuotaApi;
  fecha_pago: string | null;
}

export interface Comision {
  valor_comision: string;
  updated_at: string;
}

export interface UpdateComisionPayload {
  valor_comision: string;
}
