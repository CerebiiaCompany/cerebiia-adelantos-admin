import type { AuthTokens, AuthUser } from "@/lib/api/types";

const KEYS = {
  access: "cerebiia_sa_access",
  refresh: "cerebiia_sa_refresh",
  user: "cerebiia_sa_user",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getStorage(persistent: boolean): Storage | null {
  if (!isBrowser()) return null;
  return persistent ? localStorage : sessionStorage;
}

function getActiveStorage(): Storage | null {
  if (!isBrowser()) return null;
  if (localStorage.getItem(KEYS.access)) return localStorage;
  if (sessionStorage.getItem(KEYS.access)) return sessionStorage;
  return null;
}

export function getAccessToken(): string | null {
  return getActiveStorage()?.getItem(KEYS.access) ?? null;
}

export function getRefreshToken(): string | null {
  return getActiveStorage()?.getItem(KEYS.refresh) ?? null;
}

export function getStoredUser(): AuthUser | null {
  const raw = getActiveStorage()?.getItem(KEYS.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveAuthSession(user: AuthUser, tokens: AuthTokens, remember: boolean): void {
  const storage = getStorage(remember);
  const other = getStorage(!remember);
  if (!storage) return;

  other?.removeItem(KEYS.access);
  other?.removeItem(KEYS.refresh);
  other?.removeItem(KEYS.user);

  storage.setItem(KEYS.access, tokens.access);
  storage.setItem(KEYS.refresh, tokens.refresh);
  storage.setItem(KEYS.user, JSON.stringify(user));
}

export function updateTokens(tokens: AuthTokens): void {
  const storage = getActiveStorage();
  if (!storage) return;

  storage.setItem(KEYS.access, tokens.access);
  storage.setItem(KEYS.refresh, tokens.refresh);
}

export function clearAuthSession(): void {
  if (!isBrowser()) return;

  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(KEYS.access);
    storage.removeItem(KEYS.refresh);
    storage.removeItem(KEYS.user);
  }
}

export function updateStoredUser(user: AuthUser): void {
  const storage = getActiveStorage();
  if (!storage) return;
  storage.setItem(KEYS.user, JSON.stringify(user));
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}
