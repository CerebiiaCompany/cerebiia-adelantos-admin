import { useCallback, useEffect, useMemo, useState } from "react";
import { listSolicitudesAdmin } from "@/lib/api/adelantos";
import { solicitudesListToAdelantos } from "@/lib/adelantos-mapper";
import type { Adelanto } from "@/lib/admin-store";
import { ApiError } from "@/lib/api/errors";
import type { ListSolicitudesAdminParams } from "@/lib/api/types";

const DEFAULT_PAGE_SIZE = 20;

export type UseSolicitudesAdminOptions = {
  /** Si false, no carga automáticamente (útil cuando params aún no están listos). */
  enabled?: boolean;
  pageSize?: number;
};

/**
 * Listado paginado de solicitudes admin (una sola página por request).
 * Evita vaciar todo el historial con fetchAdelantosFromApi.
 */
export function useSolicitudesAdmin(
  apiParams?: Omit<ListSolicitudesAdminParams, "page" | "page_size">,
  options: UseSolicitudesAdminOptions = {},
) {
  const { enabled = true, pageSize = DEFAULT_PAGE_SIZE } = options;
  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = useMemo(() => JSON.stringify(apiParams ?? {}), [apiParams]);

  // Reinicia a página 1 cuando cambian filtros del servidor.
  useEffect(() => {
    setPage(1);
  }, [paramsKey]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const filters = paramsKey
        ? (JSON.parse(paramsKey) as Omit<ListSolicitudesAdminParams, "page" | "page_size">)
        : undefined;
      const res = await listSolicitudesAdmin({
        ...filters,
        page,
        page_size: pageSize,
      });
      setAdelantos(solicitudesListToAdelantos(res.results));
      setCount(res.count);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las solicitudes desde el servidor.",
      );
      setAdelantos([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [enabled, paramsKey, page, pageSize]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const totalPages = Math.max(1, Math.ceil(count / Math.max(pageSize, 1)));

  return {
    adelantos,
    loading,
    error,
    reload,
    page,
    setPage,
    pageSize,
    count,
    totalPages,
  };
}
