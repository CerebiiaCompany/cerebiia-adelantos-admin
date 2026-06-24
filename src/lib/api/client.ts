import { API_BASE_URL } from "./config";
import { ApiError, parseApiErrorMessage } from "./errors";
import { getAccessToken } from "@/lib/auth-storage";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { auth = false, headers: initHeaders, ...init } = options;
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(
      0,
      "No se pudo conectar con el servidor. Verifica que el backend esté activo en el puerto 8000.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const body = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, parseApiErrorMessage(response.status, body), body);
  }

  return body as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
