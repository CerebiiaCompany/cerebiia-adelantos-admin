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
  if (!body || typeof body !== "string") return null;

  // 1. Exception value in <pre class="exception_value">
  const valueMatch = body.match(/<pre class="exception_value">([\s\S]*?)<\/pre>/i);
  // 2. Exception type
  const typeMatch = body.match(/<th>Exception Type:<\/th>\s*<td>([\s\S]*?)<\/td>/i);
  // 3. Exception value in table
  const tableValMatch = body.match(/<th>Exception Value:<\/th>\s*<td><pre>([\s\S]*?)<\/pre>/i);
  // 4. Exception in h1 / summary
  const h1Match = body.match(/<div id="summary">\s*<h1>([\s\S]*?)<\/h1>/i);

  const rawType = typeMatch?.[1]?.replace(/<[^>]+>/g, "").trim();
  const rawVal =
    valueMatch?.[1] ||
    tableValMatch?.[1] ||
    body.match(/Exception Value:\s*(.+)/i)?.[1] ||
    h1Match?.[1];

  if (rawVal) {
    const cleanVal = rawVal
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/<[^>]+>/g, "")
      .trim();
    return rawType ? `${rawType}: ${cleanVal}` : cleanVal;
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
