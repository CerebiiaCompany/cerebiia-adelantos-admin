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
  telefono: string;
  email: string;
  password: string;
  full_name: string;
}

export interface UpdateEmpresaPayload {
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  full_name: string;
  password?: string;
}

export interface ApiEmpresa {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
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
  telefono: string;
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

/** `GET /admin/control-pagos/?mes=&anio=` — total_a_cobrar = cuotas del periodo. */
export interface ControlPagoEmpresaApi {
  empresa_id: string;
  empresa_nombre: string;
  empresa_nit: string;
  solicitudes_rechazadas: number;
  solicitudes_pagadas: number;
  total_pagado: string;
  comisiones_generadas: string;
  total_a_cobrar: string;
  cuenta_cobro_id?: string | null;
  cuenta_cobro_estado?: string | null;
}

/** `GET /admin/control-pagos/periodos/?empresa_id=` */
export interface ControlPagosPeriodoApi {
  periodo: string;
  anio: number;
  mes: number;
  es_actual: boolean;
}

export type EstadoCuentaCobroApi =
  | "borrador"
  | "emitida"
  | "evidencia_enviada"
  | "verificada"
  | "rechazada";

/** `GET|POST /admin/cuentas-cobro/` */
export interface CuentaCobroApi {
  id: string;
  empresa_id: string;
  periodo: string;
  adelanto_ids: string[];
  monto_pagado: string;
  monto_comision: string;
  monto_total_cobrar: string;
  estado: EstadoCuentaCobroApi;
  documento_cobro: string | null;
  documento_cobro_url: string | null;
  evidencia_pago: string | null;
  evidencia_pago_url: string | null;
  fecha_emision: string | null;
  fecha_evidencia: string | null;
  fecha_verificacion: string | null;
  nota_revision: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ListCuentasCobroParams = {
  periodo?: string;
  empresa_id?: string;
};

export type CrearCuentaCobroPayload = {
  empresa_id: string;
  periodo: string;
  adelanto_ids?: string[];
};

export type ListControlPagosParams = {
  mes: number;
  anio: number;
  empresa_id?: string;
};

/** `GET /admin/referencia-nomina/?empresa_id=&periodo=` */
export interface ReferenciaNominaDetalleApi {
  inicio_periodo: string;
  fin_periodo: string;
  numero_documento: string;
  nombre: string;
  apellido: string;
  solicitud_id: string;
  cuota_numero: number;
  total_cuotas: number;
  fecha_corte: string;
  monto_a_descontar: string;
  monto_solicitud: string;
  tarifa_cuota: string;
  tarifa_total_solicitud: string;
  estado_cuota: string;
}

export interface ReferenciaNominaResumenApi {
  inicio_periodo: string;
  fin_periodo: string;
  numero_documento: string;
  nombre: string;
  apellido: string;
  cantidad_adelantos: number;
  total_cuotas: number;
  /** Desglose por adelanto, ej. "1+1+2". */
  detalle_cuotas: string;
  total_costo_servicio: string;
  /** Monto solicitado − comisión (tarifa × cuotas). */
  total_neto_transferido: string;
  total_solicitado: string;
  total_a_descontar_mes: string;
  total_a_pagar_proveedor: string;
}

export interface ReferenciaNominaTotalesApi {
  cantidad_adelantos: number;
  total_cuotas: number;
  total_costo_servicio: string;
  total_neto_transferido: string;
  total_solicitado: string;
  total_a_descontar_mes: string;
  total_a_pagar_proveedor: string;
}

export interface ReferenciaNominaApi {
  empresa_id: string;
  empresa_nombre: string;
  empresa_nit: string;
  periodo: string;
  inicio_periodo: string;
  fin_periodo: string;
  detalle: ReferenciaNominaDetalleApi[];
  resumen: ReferenciaNominaResumenApi[];
  total_a_descontar: string;
  totales: ReferenciaNominaTotalesApi;
}

/** Ítem de auditoría admin (`GET /admin/auditoria/`). */
export interface AuditoriaAdminItem {
  id: string;
  solicitud_id: string;
  admin_user_id: string | null;
  admin_nombre: string;
  accion: string;
  estado_anterior: string;
  estado_nuevo: string;
  created_at: string;
}

export interface ListadoAuditoriaApi {
  count: number;
  page: number;
  page_size: number;
  next: number | null;
  previous: number | null;
  results: AuditoriaAdminItem[];
}

export type ListAuditoriaParams = {
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  page_size?: number;
};

export interface AuditoriaIndicadoresApi {
  en_revision: number;
  aprobadas: number;
  rechazadas: number;
  pagos_confirmados: number;
}

export interface HistorialAdelantosIndicadoresApi {
  total_solicitudes: number;
  aprobadas: number;
  pendientes: number;
  rechazadas: number;
  pagadas: number;
  monto_total_procesado: string;
}

export interface SolicitudHistorialAdminItem {
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
  motivo_rechazo: string | null;
  decidido_por_id: string | null;
  decidido_por_nombre: string | null;
  decidido_en: string | null;
  comprobante_pago_url: string | null;
  pagado_en: string | null;
  banco_nombre: string | null;
  tipo_cuenta: string | null;
  numero_cuenta: string | null;
  created_at: string | null;
}

export interface HistorialAdelantosAdminResponse {
  indicadores: HistorialAdelantosIndicadoresApi;
  count: number;
  page: number;
  page_size: number;
  next: number | null;
  previous: number | null;
  results: SolicitudHistorialAdminItem[];
}

export type ListHistorialAdelantosParams = {
  empresa_id?: string;
  estado?: EstadoSolicitudApi;
  fecha_desde?: string;
  fecha_hasta?: string;
  /** Nombre o documento del empleado (icontains). */
  busqueda?: string;
  /** Filtra por `numero_cuotas_snapshot` exacto (1, 2, 3…). */
  numero_cuotas?: number;
  page?: number;
  page_size?: number;
};

export type SuspenderEmpresaResponse = ReactivarEmpresaResponse;

export interface ConfiguracionGlobal {
  porcentaje_maximo_adelanto: string;
  numero_maximo_cuotas: number;
  plazo_maximo_dias: number;
  tarifa_fija_por_cuota: string;
  monto_minimo: string;
  updated_at: string;
}

export interface UpdateConfiguracionPayload {
  porcentaje_maximo_adelanto: string;
  numero_maximo_cuotas: number;
  plazo_maximo_dias: number;
  tarifa_fija_por_cuota: string;
  monto_minimo: string;
}

export interface HistorialConfiguracion {
  id: string;
  porcentaje_maximo_adelanto: string;
  numero_maximo_cuotas: number;
  plazo_maximo_dias: number;
  tarifa_fija_por_cuota: string;
  monto_minimo: string;
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
  motivo_rechazo?: string | null;
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
  /** Snapshots al crear la solicitud (null en registros antiguos). */
  saldo_disponible_antes?: string | null;
  saldo_disponible_despues?: string | null;
  nomina_antes?: string | null;
  nomina_despues?: string | null;
  total_adelantos_mes?: string | null;
  tiene_contexto_operativo?: boolean;
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
  solicitudes_por_mes: Array<{
    anio: number;
    mes: number;
    total: number;
    monto_total: string;
    monto_pagado?: string;
    monto_aprobado?: string;
    monto_en_revision?: string;
    monto_solicitado?: string;
    monto_rechazado?: string;
  }>;
  monto_solicitado_por_mes: Array<{
    anio: number;
    mes: number;
    total: number;
    monto_total: string;
    monto_pagado?: string;
    monto_aprobado?: string;
    monto_en_revision?: string;
    monto_solicitado?: string;
    monto_rechazado?: string;
  }>;
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

/** Ítem de `GET /empleados/admin/?empresa_id=`. */
export interface EmpleadoAdminApi {
  id: string;
  documento: string;
  nombre: string;
  salario: string;
  banco_id: string;
  banco_nombre: string;
  numero_cuenta: string;
  tipo_documento: string;
  email_empleado: string;
  celular: string;
  tipo_contrato: string;
  fecha_ingreso: string;
  tipo_cuenta: string;
  estado: string;
  empresa_id: string;
  empresa_nombre?: string;
  saldo_disponible: string;
  created_at: string;
  updated_at: string;
}

export interface ListadoEmpleadosAdminApi {
  count: number;
  page: number;
  page_size: number;
  next: number | null;
  previous: number | null;
  results: EmpleadoAdminApi[];
}

export type ListEmpleadosAdminParams = {
  /** Si se omite, lista empleados de todas las empresas. */
  empresa_id?: string;
  page?: number;
  page_size?: number;
  nombre?: string;
  email?: string;
  documento?: string;
  /** Si se omite, incluye activo, pre_registrado e inactivo. */
  estado?: string;
};

export interface Comision {
  valor_comision: string;
  updated_at: string;
}

export interface UpdateComisionPayload {
  valor_comision: string;
}
