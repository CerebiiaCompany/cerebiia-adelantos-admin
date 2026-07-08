import { useCallback, useEffect, useState } from "react";
import { getEmpleadosMetricas } from "@/lib/api/adelantos";
import { ApiError } from "@/lib/api/errors";
import type { EmpleadosMetricasApi } from "@/lib/api/types";

export function useEmpleadosMetricas() {
  const [data, setData] = useState<EmpleadosMetricasApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getEmpleadosMetricas());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las métricas de empleados.");
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
