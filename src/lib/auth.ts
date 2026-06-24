import { apiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { AuthUser, LoginResponse, RefreshResponse } from "@/lib/api/types";
import { SUPER_ADMIN_ROLE } from "@/lib/api/types";
import {
  clearAuthSession,
  getRefreshToken,
  isLoggedIn,
  saveAuthSession,
  updateStoredUser,
  updateTokens,
} from "@/lib/auth-storage";

export {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  isLoggedIn,
} from "@/lib/auth-storage";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

function assertSuperAdmin(user: AuthUser): void {
  if (user.role !== SUPER_ADMIN_ROLE) {
    throw new AuthError("Solo usuarios super administrador pueden acceder a este panel.");
  }

  if (!user.is_active) {
    throw new AuthError("Tu cuenta está inactiva. Contacta al administrador del sistema.");
  }
}

export async function login(
  email: string,
  password: string,
  remember = true,
): Promise<AuthUser> {
  const data = await apiRequest<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password }),
  });

  assertSuperAdmin(data.user);
  saveAuthSession(data.user, data.tokens, remember);

  return data.user;
}

async function fetchMe(): Promise<AuthUser> {
  const user = await apiRequest<AuthUser>("/auth/me/", { auth: true });
  assertSuperAdmin(user);
  updateStoredUser(user);
  return user;
}

export async function validateSession(): Promise<AuthUser | null> {
  if (!isLoggedIn()) return null;

  try {
    return await fetchMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        try {
          return await fetchMe();
        } catch {
          clearAuthSession();
          return null;
        }
      }
    }

    clearAuthSession();
    return null;
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const data = await apiRequest<RefreshResponse>("/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });

    updateTokens({ access: data.access, refresh: data.refresh });
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();

  try {
    if (refresh && isLoggedIn()) {
      await apiRequest<void>("/auth/logout/", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ refresh }),
      });
    }
  } catch {
    // La sesión local se limpia aunque falle el endpoint.
  } finally {
    clearAuthSession();
  }
}
