const REMEMBER_KEY = "cerebiia_sa_remember_login";
const EMAIL_KEY = "cerebiia_sa_login_email";
/** Versiones anteriores guardaban aquí la contraseña en texto plano; solo se usa para borrarla. */
const LEGACY_PASSWORD_KEY = "cerebiia_sa_login_password";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Elimina la contraseña que versiones anteriores dejaron en localStorage. */
function purgeLegacyPassword(): void {
  localStorage.removeItem(LEGACY_PASSWORD_KEY);
}

export function readRememberLoginPreference(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(REMEMBER_KEY) === "true";
}

/**
 * "Recordarme" solo conserva el correo. La contraseña de super admin nunca se
 * persiste en el navegador: cualquier XSS o acceso al equipo la expondría.
 */
export function readSavedLoginEmail(): string | null {
  if (!isBrowser()) return null;
  purgeLegacyPassword();
  if (!readRememberLoginPreference()) return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function saveLoginEmail(email: string): void {
  if (!isBrowser()) return;

  purgeLegacyPassword();
  localStorage.setItem(REMEMBER_KEY, "true");
  localStorage.setItem(EMAIL_KEY, email.trim());
}

export function clearLoginCredentials(): void {
  if (!isBrowser()) return;

  localStorage.setItem(REMEMBER_KEY, "false");
  localStorage.removeItem(EMAIL_KEY);
  purgeLegacyPassword();
}
