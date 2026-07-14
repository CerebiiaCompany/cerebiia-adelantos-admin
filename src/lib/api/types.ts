export const SUPER_ADMIN_ROLE = "super_admin" as const;

export type UserRole = "super_admin" | "empresa" | "empleado";

export interface UserEmpresaResumen {
  id: string;
  nombre: string;
  nit: string;
  activa: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
  /** Presente en `GET /users/` enriquecido; `null` si no es rol empresa. */
  empresa?: UserEmpresaResumen | null;
  /** Empleados de la empresa asociada (0 si no aplica). */
  empleados_count?: number;
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
  dia_pago_nomina: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

/** Ítem de `GET /empresas/listar/`. */
export interface EmpresaListItem {
  id: string;
  nombre: string;
  nit: string;
  user_id: string;
  dia_pago_nomina: number;
  activa: boolean;
  total_empleados: number;
  total_solicitudes: number;
  monto_total_adelantado: string;
  created_at: string;
  updated_at: string;
}

export interface ReactivarEmpresaResponse {
  id: string;
  nombre: string;
  nit: string;
  activa: boolean;
}

export type ListEmpresasParams = {
  mes?: number;
  anio?: number;
};

export type ListUsersParams = {
  role?: UserRole;
};

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
  monto_a_recibir?: string;
  numero_cuotas_snapshot: number;
  plazo_dias_snapshot: number;
  estado: EstadoSolicitudApi;
  motivo_rechazo?: string | null;
  comprobante_pago?: string | null;
  comprobante_pago_url?: string | null;
  pagado_en?: string | null;
  decidido_por_id?: string | null;
  decidido_en?: string | null;
  tarifa_total?: string;
  created_at: string;
  updated_at?: string;
}

/** Ítem del listado paginado `GET /adelantos/admin/solicitudes/`. */
export interface SolicitudAdminListItem {
  id: string;
  empleado_id: string;
  empleado_nombre: string;
  empleado_documento: string;
  empresa_id: string;
  empresa_nombre: string;
  empresa_nit: string;
  monto: string;
  monto_neto: string;
  tarifa_total: string;
  numero_cuotas_snapshot: number;
  estado: EstadoSolicitudApi;
  decidido_por_id: string | null;
  decidido_en: string | null;
  comprobante_pago_url: string | null;
  pagado_en: string | null;
  banco_nombre: string | null;
  tipo_cuenta: string | null;
  numero_cuenta: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ListSolicitudesAdminParams = {
  fecha_desde?: string;
  fecha_hasta?: string;
  nombre?: string;
  documento?: string;
  estado?: EstadoSolicitudApi;
  page?: number;
  page_size?: number;
};

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
  tarifa_cuota?: string;
  fecha_corte: string;
  estado: EstadoCuotaApi;
  fecha_pago: string | null;
}

export interface SolicitudDetalleResponse {
  solicitud: SolicitudAdelantoApi;
  cuotas: CuotaAdelantoApi[];
}

export interface DashboardAdelantosApi {
  total_solicitudes: number;
  conteo_por_estado: Partial<Record<EstadoSolicitudApi, number>>;
  monto_total_solicitado: string;
  monto_total_aprobado: string;
  monto_total_pendiente: string;
  solicitud_promedio: string;
  cuotas_mas_frecuente: number;
  empleados_con_solicitudes: number;
  empleados_sin_solicitudes: number;
  empleado_mas_solicitudes: { id: string; nombre: string; total: number } | null;
  empleado_mayor_monto: { id: string; nombre: string; monto_total: string } | null;
  solicitudes_por_mes: Array<{ anio: number; mes: number; total: number; monto_total: string }>;
  monto_solicitado_por_mes: Array<{ anio: number; mes: number; total: number; monto_total: string }>;
  tasa_aprobacion_por_mes: Array<{
    anio: number;
    mes: number;
    total: number;
    aprobadas: number;
    tasa: number;
  }>;
}

export interface EmpleadosMetricasApi {
  total_empleados: number;
  activos: number;
  pre_registrados: number;
  inactivos: number;
  distribucion_tipo_contrato: Record<string, number>;
  distribucion_banco: Record<string, number>;
  distribucion_tipo_cuenta: Record<string, number>;
  masa_salarial_total: string;
  salario_promedio: string;
}

export interface Comision {
  valor_comision: string;
  updated_at: string;
}

export interface UpdateComisionPayload {
  valor_comision: string;
}
