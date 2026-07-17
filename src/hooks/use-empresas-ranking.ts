import { useCallback, useEffect, useState } from "react";
import { listarEmpresas } from "@/lib/api/empresas";
import { ApiError } from "@/lib/api/errors";
import type { EmpresaListItem } from "@/lib/api/types";

/** Ranking de empresas por monto adelantado (usa stats de listar). */
export function useEmpresasRanking(periodoKey: string) {
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
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
      setEmpresas(await listarEmpresas(params));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar empresas.");
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  }, [periodoKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { empresas, loading, error, reload };
}

export function empresasToBars(empresas: EmpresaListItem[]) {
  return empresas
    .map((e) => ({
      id: e.id,
      nombre: e.nombre,
      nombreCorto: e.nombre.slice(0, 14),
      activa: e.activa,
      total: Number(e.monto_total_adelantado) || 0,
      cantidad: e.total_solicitudes,
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
}
