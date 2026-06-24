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
  updated_at: string;
}

export interface UpdateConfiguracionPayload {
  porcentaje_maximo_adelanto: string;
  numero_maximo_cuotas: number;
  plazo_maximo_dias: number;
}

export interface HistorialConfiguracion {
  id: string;
  porcentaje_maximo_adelanto: string;
  numero_maximo_cuotas: number;
  plazo_maximo_dias: number;
  actualizado_por: string | null;
  timestamp: string;
}

export interface Comision {
  porcentaje_comision: string;
  updated_at: string;
}

export interface UpdateComisionPayload {
  porcentaje_comision: string;
}
