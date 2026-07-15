import { useCallback, useEffect, useState } from "react";
import { listSolicitudesAdmin } from "@/lib/api/adelantos";
import { solicitudesListToAdelantos } from "@/lib/adelantos-mapper";
import type { Adelanto } from "@/lib/admin-store";
import { ApiError } from "@/lib/api/errors";

/** Solo las N solicitudes más recientes (dashboard). Una sola request. */
export function useSolicitudesRecientes(limit = 6) {
  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listSolicitudesAdmin({ page: 1, page_size: limit });
      setAdelantos(solicitudesListToAdelantos(res.results));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las solicitudes recientes.",
      );
      setAdelantos([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { adelantos, loading, error, reload };
}
