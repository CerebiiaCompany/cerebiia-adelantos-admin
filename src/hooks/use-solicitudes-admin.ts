import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdelantosFromApi } from "@/lib/adelantos-api-sync";
import type { Adelanto } from "@/lib/admin-store";
import { ApiError } from "@/lib/api/errors";
import type { ListSolicitudesAdminParams } from "@/lib/api/types";

export function useSolicitudesAdmin(apiParams?: ListSolicitudesAdminParams) {
  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = useMemo(() => JSON.stringify(apiParams ?? {}), [apiParams]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = paramsKey ? (JSON.parse(paramsKey) as ListSolicitudesAdminParams) : undefined;
      setAdelantos(await fetchAdelantosFromApi(params));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las solicitudes desde el servidor.",
      );
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { adelantos, loading, error, reload };
}
