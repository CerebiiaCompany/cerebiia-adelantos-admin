// En desarrollo usa proxy de Vite (/api/v1 → localhost:8000) para evitar CORS.
const defaultBaseUrl = import.meta.env.DEV ? "/api/v1" : "http://localhost:8000/api/v1";
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl;

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, "");
