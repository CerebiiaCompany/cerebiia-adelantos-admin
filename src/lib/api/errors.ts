export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function parseApiErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;

    if (typeof record.detail === "string") {
      return record.detail;
    }

    for (const [field, value] of Object.entries(record)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        return `${field}: ${value[0]}`;
      }
    }
  }

  if (status === 401) return "Correo o contraseña incorrectos";
  if (status === 403) return "No tienes permisos para acceder a este panel";
  if (status === 404) return "El recurso solicitado no existe en el servidor (404).";
  if (status === 422) return "Los datos enviados no son válidos";

  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
