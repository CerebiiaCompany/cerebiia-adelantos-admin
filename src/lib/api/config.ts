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

  let normalized = path.trim();
  if (!normalized) return null;

  // Host Docker interno no resoluble en el navegador del host.
  if (/^https?:\/\/minio(?::\d+)?\//i.test(normalized)) {
    try {
      const u = new URL(normalized);
      u.hostname = "localhost";
      normalized = u.toString();
    } catch {
      /* keep original */
    }
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  const withoutSlash = normalized.replace(/^\//, "");
  const mediaPath = withoutSlash.startsWith("media/")
    ? `/${withoutSlash}`
    : `/media/${withoutSlash}`;

  if (import.meta.env.DEV && !API_BASE_URL.startsWith("http")) {
    return mediaPath;
  }
  return `${API_ORIGIN}${mediaPath}`;
}

export type ComprobanteFileKind = "image" | "pdf" | "other";

export function getComprobanteFileKind(url: string): ComprobanteFileKind {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (/\.(png|jpg|jpeg|jpe|gif|webp|bmp|svg)$/.test(path)) return "image";
  if (path.endsWith(".pdf")) return "pdf";
  return "other";
}
