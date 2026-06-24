const KEY = "lov_admin_session";

export const DEMO_USER = "admin@panel.co";
export const DEMO_PASS = "admin123";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function login(email: string, pass: string): boolean {
  if (email.trim().toLowerCase() === DEMO_USER && pass === DEMO_PASS) {
    localStorage.setItem(KEY, "1");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(KEY);
}
