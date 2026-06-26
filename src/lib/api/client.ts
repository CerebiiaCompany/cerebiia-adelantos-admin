import { API_BASE_URL } from "./config";
import { ApiError, parseApiErrorMessage } from "./errors";
import { scheduleApiRequest } from "./rate-limit";
import type { RefreshResponse } from "./types";
import { clearAuthSession, getAccessToken, getRefreshToken, updateTokens } from "@/lib/auth-storage";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

const NO_REFRESH_PATHS = ["/auth/login/", "/auth/refresh/"];

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessTokenOnce(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
      const data = await executeRequest<RefreshResponse>("/auth/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
      });
      updateTokens({ access: data.access, refresh: data.refresh });
      return true;
    } catch {
      clearAuthSession();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function executeRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const { auth = false, headers: initHeaders, ...init } = options;
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
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

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  isRetry = false,
): Promise<T> {
  const method = options.method ?? "GET";

  const run = async (): Promise<T> => {
    try {
      return await executeRequest<T>(path, options);
    } catch (error) {
      if (
        !isRetry &&
        options.auth &&
        error instanceof ApiError &&
        error.status === 401 &&
        !NO_REFRESH_PATHS.includes(path)
      ) {
        const refreshed = await refreshAccessTokenOnce();
        if (refreshed) {
          return apiRequest<T>(path, options, true);
        }
      }
      throw error;
    }
  };

  return scheduleApiRequest(method, path, run);
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
