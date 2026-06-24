export const BRAND_GRADIENT = "var(--gradient-primary)";
export const PANEL_BG = "hsl(var(--background))";
export const PANEL_BG_ALT = "hsl(var(--shell-surface))";

/** Solo pantalla de login Super Admin */
export const LOGIN_FORM_BG = "#F5F3FF";
export const LOGIN_LEFT_GRADIENT =
  "linear-gradient(145deg, #5B21B6 0%, #7C3AED 38%, #8B5CF6 68%, #C4B5FD 100%)";
export const LOGIN_PRIMARY = "#8B5CF6";

export function getUserInitials(fullName: string, email: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}
