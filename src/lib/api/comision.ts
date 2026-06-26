import { getConfiguracion, updateConfiguracion } from "./configuracion";
import type { Comision, ConfiguracionGlobal, UpdateComisionPayload } from "./types";

/**
 * La comisión vive en configuración global como `tarifa_fija_por_cuota`.
 * Este módulo mantiene compatibilidad con código que esperaba /comision/.
 */

export function comisionFromConfiguracion(config: ConfiguracionGlobal): Comision {
  return {
    valor_comision: config.tarifa_fija_por_cuota.replace(/\.00$/, "") || "0",
    updated_at: config.updated_at,
  };
}

export async function getComision() {
  const config = await getConfiguracion();
  return comisionFromConfiguracion(config);
}

export async function updateComision(
  payload: UpdateComisionPayload,
  current?: ConfiguracionGlobal | null,
) {
  if (!current) {
    current = await getConfiguracion();
  }

  const tarifa = payload.valor_comision.includes(".")
    ? payload.valor_comision
    : `${payload.valor_comision}.00`;

  const updated = await updateConfiguracion({
    porcentaje_maximo_adelanto: current.porcentaje_maximo_adelanto,
    numero_maximo_cuotas: current.numero_maximo_cuotas,
    plazo_maximo_dias: current.plazo_maximo_dias,
    tarifa_fija_por_cuota: tarifa,
  });

  return comisionFromConfiguracion(updated);
}
