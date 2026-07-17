import { useCallback, useEffect, useState } from "react";
import { listSolicitudesAdmin } from "@/lib/api/adelantos";
import { solicitudesListToAdelantos } from "@/lib/adelantos-mapper";
import type { Adelanto } from "@/lib/admin-store";
import { ApiError } from "@/lib/api/errors";

function periodToDateRange(periodoKey: string): { fecha_desde?: string; fecha_hasta?: string } {
  if (periodoKey === "historico") return {};
  const [anio, mes] = periodoKey.split("-").map(Number);
  const lastDay = new Date(anio, mes, 0).getDate();
  const mm = String(mes).padStart(2, "0");
  return {
    fecha_desde: `${anio}-${mm}-01`,
    fecha_hasta: `${anio}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Solo las N solicitudes más recientes (dashboard). */
export function useSolicitudesRecientes(limit = 6, periodoKey = "historico") {
  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = periodToDateRange(periodoKey);
      const res = await listSolicitudesAdmin({
        page: 1,
        page_size: limit,
        ...range,
      });
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
  }, [limit, periodoKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { adelantos, loading, error, reload };
}
