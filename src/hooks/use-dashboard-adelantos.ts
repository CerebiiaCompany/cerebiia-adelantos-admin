import { useCallback, useEffect, useState } from "react";
import { getDashboardAdelantos } from "@/lib/api/adelantos";
import { ApiError } from "@/lib/api/errors";
import type { DashboardAdelantosApi } from "@/lib/api/types";

export function useDashboardAdelantos(periodoKey: string) {
  const [data, setData] = useState<DashboardAdelantosApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params =
        periodoKey === "historico"
          ? undefined
          : (() => {
              const [anio, mes] = periodoKey.split("-").map(Number);
              return { mes, anio };
            })();
      setData(await getDashboardAdelantos(params));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el dashboard.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [periodoKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
