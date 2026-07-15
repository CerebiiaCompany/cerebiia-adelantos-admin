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

/** Extrae el mensaje de páginas de error HTML de Django en modo debug. */
function extractDjangoHtmlError(body: string): string | null {
  const valueMatch = body.match(/<pre class="exception_value">([\s\S]*?)<\/pre>/i);
  if (valueMatch?.[1]) {
    return valueMatch[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
  }

  const plainMatch = body.match(/Exception Value:\s*(.+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].replace(/<[^>]+>/g, "").trim();
  }

  return null;
}

export function parseApiErrorMessage(status: number, body: unknown): string {
  if (typeof body === "string") {
    const djangoMsg = extractDjangoHtmlError(body);
    if (djangoMsg) {
      if (/does not exist/i.test(djangoMsg)) {
        return `El backend no tiene la base de datos actualizada (migración pendiente). Ejecuta make migrate en el servidor. Detalle: ${djangoMsg}`;
      }
      return djangoMsg;
    }
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;

    if (typeof record.detail === "string") {
      if (/signature has expired|token.*expired|expirad/i.test(record.detail)) {
        return "La sesión expiró. Se intentará renovar el token; si el error continúa, vuelve a iniciar sesión.";
      }
      if (/monto neto.*mayor a 0/i.test(record.detail)) {
        return `${record.detail}. Hay solicitudes en la base de datos con monto neto inválido, o la tarifa de comisión configurada deja el neto en cero. Revisa Configuración y los registros en el backend.`;
      }
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
  if (status === 405) return "Esta acción no está disponible en el servidor (método no permitido).";
  if (status === 404) return "El recurso solicitado no existe en el servidor (404).";
  if (status === 422) return "Los datos enviados no son válidos";
  if (status === 429) return "Demasiadas peticiones. Espera un momento e intenta de nuevo.";
  if (status === 500) {
    return "Error interno del servidor (500). Revisa que el backend esté actualizado y las migraciones aplicadas.";
  }

  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
