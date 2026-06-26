import { useCallback, useEffect, useState } from "react";

import { getComision } from "@/lib/api/comision";

import { getConfiguracion } from "@/lib/api/configuracion";

import {

  DEFAULT_COMISION_VALOR,

  DEFAULT_MAX_CUOTAS,

  calcularDesgloseAdelanto,

  readComisionCache,

  type DesgloseAdelanto,

} from "@/lib/adelanto-calculo";



async function fetchParametros() {

  const [cfgResult, comisionResult] = await Promise.allSettled([

    getConfiguracion(),

    getComision(),

  ]);



  let numeroMaximoCuotas = DEFAULT_MAX_CUOTAS;

  let valorComision = readComisionCache() ?? DEFAULT_COMISION_VALOR;



  if (cfgResult.status === "fulfilled") {

    numeroMaximoCuotas = cfgResult.value.numero_maximo_cuotas;

  }



  if (comisionResult.status === "fulfilled") {

    valorComision = comisionResult.value.valor_comision;

  } else {

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

    const onFocus = () => void reload();

    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);

  }, [reload]);



  const calcular = useCallback(

    (monto: number, numeroCuotas: number): DesgloseAdelanto =>

      calcularDesgloseAdelanto(monto, numeroCuotas, valorComision, numeroMaximoCuotas),

    [valorComision, numeroMaximoCuotas],

  );



  return { numeroMaximoCuotas, valorComision, loading, calcular };

}

