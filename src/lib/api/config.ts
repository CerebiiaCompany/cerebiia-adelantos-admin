// En desarrollo usa proxy de Vite (/api/v1 → localhost:8000) para evitar CORS.
const defaultBaseUrl = import.meta.env.DEV ? "/api/v1" : "http://localhost:8000/api/v1";
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl;

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, "");

/** Origen del backend sin `/api/v1` (p. ej. media/comprobantes). */
export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ??
  (API_BASE_URL.startsWith("http")
    ? API_BASE_URL.replace(/\/api\/v1\/?$/, "")
    : import.meta.env.DEV
      ? "http://localhost:8000"
      : "http://localhost:8000");

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.replace(/^\//, "");
  if (import.meta.env.DEV && !API_BASE_URL.startsWith("http")) {
    return `/media/${normalized}`;
  }
  return `${API_ORIGIN}/media/${normalized}`;
}
