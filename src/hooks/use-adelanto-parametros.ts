import { useCallback, useEffect, useState } from "react";
import { getConfiguracion } from "@/lib/api/configuracion";
import { comisionFromConfiguracion } from "@/lib/api/comision";
import {
  DEFAULT_COMISION_VALOR,
  DEFAULT_MAX_CUOTAS,
  calcularDesgloseAdelanto,
  readComisionCache,
  type DesgloseAdelanto,
} from "@/lib/adelanto-calculo";

async function fetchParametros() {
  let numeroMaximoCuotas = DEFAULT_MAX_CUOTAS;
  let valorComision = readComisionCache() ?? DEFAULT_COMISION_VALOR;

  try {
    const config = await getConfiguracion();
    numeroMaximoCuotas = config.numero_maximo_cuotas;
    valorComision = comisionFromConfiguracion(config).valor_comision;
  } catch {
    const cached = readComisionCache();
    if (cached) valorComision = cached;
  }

  return { numeroMaximoCuotas, valorComision };
}

export function useAdelantoParametros() {
  const [numeroMaximoCuotas, setNumeroMaximoCuotas] = useState(DEFAULT_MAX_CUOTAS);
  const [valorComision, setValorComision] = useState(
    () => readComisionCache() ?? DEFAULT_COMISION_VALOR,
  );
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const params = await fetchParametros();
    setNumeroMaximoCuotas(params.numeroMaximoCuotas);
    setValorComision(params.valorComision);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const calcular = useCallback(
    (monto: number, numeroCuotas: number): DesgloseAdelanto =>
      calcularDesgloseAdelanto(monto, numeroCuotas, valorComision, numeroMaximoCuotas),
    [valorComision, numeroMaximoCuotas],
  );

  return { numeroMaximoCuotas, valorComision, loading, calcular };
}
