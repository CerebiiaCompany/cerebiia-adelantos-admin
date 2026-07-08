import { useCallback, useEffect, useState } from "react";
import { getDashboardAdelantos } from "@/lib/api/adelantos";
import { ApiError } from "@/lib/api/errors";
import type { DashboardAdelantosApi } from "@/lib/api/types";

export function useDashboardAdelantos() {
  const [data, setData] = useState<DashboardAdelantosApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboardAdelantos());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el dashboard.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
