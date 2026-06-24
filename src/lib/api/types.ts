export const SUPER_ADMIN_ROLE = "super_admin" as const;

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

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
