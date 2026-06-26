/** Intervalo mínimo entre inicios de petición (ms). */
const MIN_GAP_MS = 120;

/** Máximo de peticiones HTTP simultáneas. */
const MAX_CONCURRENT = 4;

/** Reutiliza la misma promesa si un GET idéntico ya está en vuelo. */
const DEDUPE_GET = true;

let activeCount = 0;
let lastStartAt = 0;
const waitQueue: Array<() => void> = [];
const inFlightGet = new Map<string, Promise<unknown>>();

function releaseSlot(): void {
  activeCount = Math.max(0, activeCount - 1);
  const next = waitQueue.shift();
  if (next) next();
}

async function acquireSlot(): Promise<void> {
  if (activeCount >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waitQueue.push(resolve));
  }

  const now = Date.now();
  const gap = MIN_GAP_MS - (now - lastStartAt);
  if (gap > 0) {
    await new Promise((resolve) => setTimeout(resolve, gap));
  }

  lastStartAt = Date.now();
  activeCount++;
}

export async function rateLimited<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await fn();
  } finally {
    releaseSlot();
  }
}

function buildRequestKey(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}

/**
 * Encola la petición con rate limit. Para GET deduplica llamadas idénticas en vuelo.
 */
export async function scheduleApiRequest<T>(
  method: string,
  path: string,
  fn: () => Promise<T>,
): Promise<T> {
  const isGet = method.toUpperCase() === "GET";
  const key = buildRequestKey(method, path);

  if (DEDUPE_GET && isGet) {
    const existing = inFlightGet.get(key);
    if (existing) return existing as Promise<T>;

    const promise = rateLimited(fn).finally(() => {
      inFlightGet.delete(key);
    });
    inFlightGet.set(key, promise);
    return promise;
  }

  return rateLimited(fn);
}
