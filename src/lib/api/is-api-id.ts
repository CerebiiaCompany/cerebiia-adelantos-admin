const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** IDs del backend son UUID; datos demo locales usan ids cortos (ej. a1). */
export function isBackendUuid(id: string): boolean {
  return UUID_RE.test(id);
}
