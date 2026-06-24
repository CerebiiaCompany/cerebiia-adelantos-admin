const REMEMBER_KEY = "cerebiia_sa_remember_login";
const EMAIL_KEY = "cerebiia_sa_login_email";
const PASSWORD_KEY = "cerebiia_sa_login_password";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readRememberLoginPreference(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(REMEMBER_KEY) === "true";
}

export function readSavedLoginCredentials(): { email: string; password: string } | null {
  if (!isBrowser() || !readRememberLoginPreference()) return null;

  const email = localStorage.getItem(EMAIL_KEY);
  const password = localStorage.getItem(PASSWORD_KEY);
  if (!email || !password) return null;

  return { email, password };
}

export function saveLoginCredentials(email: string, password: string): void {
  if (!isBrowser()) return;

  localStorage.setItem(REMEMBER_KEY, "true");
  localStorage.setItem(EMAIL_KEY, email.trim());
  localStorage.setItem(PASSWORD_KEY, password);
}

export function clearLoginCredentials(): void {
  if (!isBrowser()) return;

  localStorage.setItem(REMEMBER_KEY, "false");
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(PASSWORD_KEY);
}
