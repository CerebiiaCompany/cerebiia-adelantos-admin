export const DEFAULT_MAX_CUOTAS = 3;
export const DEFAULT_COMISION_VALOR = "5000";
export const COMISION_CACHE_KEY = "lov_comision_cache_v1";

export type DesgloseAdelanto = {
  numeroCuotas: number;
  /** Monto que solicitó el empleado. */
  montoSolicitado: number;
  /** Tarifa fija de comisión por cada cuota. */
  tarifaComision: number;
  /** Comisión total = tarifa × número de cuotas. */
  valorComision: number;
  /** Neto que recibe el empleado = monto solicitado − comisión total. */
  totalARecibir: number;
  /** Cuota de descuento en nómina = monto solicitado ÷ cuotas (sin descontar comisión). */
  valorCuota: number;
  /** Alias de montoSolicitado (monto total a recuperar vía cuotas). */
  monto: number;
  /** Alias de montoSolicitado para compatibilidad con flujos de cobro. */
  totalAPagar: number;
  /** Indica si la comisión es gratis ($0, ej. primer adelanto). */
  esGratis: boolean;
};

export function parseComisionValor(value: string | number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }
  const cleaned = value.replace(/[^\d]/g, "");
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function clampNumeroCuotas(numeroCuotas: number, maxCuotas = DEFAULT_MAX_CUOTAS): number {
  const max = Math.max(1, Math.floor(maxCuotas) || 1);
  const cuotas = Math.max(1, Math.floor(numeroCuotas) || 1);
  return Math.min(cuotas, max);
}

export function calcularDesgloseAdelanto(
  monto: number,
  numeroCuotas: number,
  valorComisionConfig: string | number,
  maxCuotas = DEFAULT_MAX_CUOTAS,
  montoNetoReal?: number,
  tarifaTotalReal?: number,
): DesgloseAdelanto {
  const cuotas = clampNumeroCuotas(numeroCuotas, maxCuotas);
  const montoSolicitado = monto;
  const valorCuota = Math.round(montoSolicitado / cuotas);

  // 1. Tarifa total explícita enviada por API/backend (ej. 0.00 en primer adelanto)
  if (tarifaTotalReal !== undefined && Number.isFinite(tarifaTotalReal)) {
    const valorComision = Math.max(0, Math.round(tarifaTotalReal));
    const tarifaComision = Math.round(valorComision / cuotas);
    const totalARecibir =
      montoNetoReal !== undefined && montoNetoReal > 0
        ? montoNetoReal
        : Math.max(0, montoSolicitado - valorComision);
    const esGratis = valorComision === 0;

    return {
      numeroCuotas: cuotas,
      montoSolicitado,
      tarifaComision,
      valorComision,
      totalARecibir,
      valorCuota,
      monto: montoSolicitado,
      totalAPagar: montoSolicitado,
      esGratis,
    };
  }

  // 2. Monto neto real igual o mayor al solicitado (sin descuento de comisión -> gratis)
  if (montoNetoReal !== undefined && montoNetoReal >= montoSolicitado) {
    return {
      numeroCuotas: cuotas,
      montoSolicitado,
      tarifaComision: 0,
      valorComision: 0,
      totalARecibir: montoNetoReal,
      valorCuota,
      monto: montoSolicitado,
      totalAPagar: montoSolicitado,
      esGratis: true,
    };
  }

  // 3. Monto neto real menor que el solicitado (se descontó comisión específica)
  if (montoNetoReal !== undefined && montoNetoReal > 0 && montoNetoReal < montoSolicitado) {
    const valorComision = montoSolicitado - montoNetoReal;
    const tarifaComision = Math.round(valorComision / cuotas);
    return {
      numeroCuotas: cuotas,
      montoSolicitado,
      tarifaComision,
      valorComision,
      totalARecibir: montoNetoReal,
      valorCuota,
      monto: montoSolicitado,
      totalAPagar: montoSolicitado,
      esGratis: valorComision === 0,
    };
  }

  // 4. Fallback con tarifa configurada
  const tarifaComision = parseComisionValor(valorComisionConfig);
  const valorComision = tarifaComision * cuotas;
  const totalARecibir = Math.max(0, montoSolicitado - valorComision);

  return {
    numeroCuotas: cuotas,
    montoSolicitado,
    tarifaComision,
    valorComision,
    totalARecibir,
    valorCuota,
    monto: montoSolicitado,
    totalAPagar: montoSolicitado,
    esGratis: valorComision === 0,
  };
}

export function inferNumeroCuotas(id: string, maxCuotas = DEFAULT_MAX_CUOTAS): number {
  const n = parseInt(id.replace(/\D/g, ""), 10) || 1;
  const max = Math.max(1, maxCuotas);
  return (n % max) + 1;
}

export function readComisionCache(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COMISION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { valor_comision?: string; porcentaje_comision?: string };
    return parsed.valor_comision ?? parsed.porcentaje_comision ?? null;
  } catch {
    return null;
  }
}

export function writeComisionCache(valorComision: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    COMISION_CACHE_KEY,
    JSON.stringify({ valor_comision: valorComision, updated_at: new Date().toISOString() }),
  );
}

export function modoPagoLabel(numeroCuotas: number): string {
  return numeroCuotas > 1 ? `A cuotas (${numeroCuotas})` : "Pago único";
}

export function esPagoACuotas(numeroCuotas: number): boolean {
  return numeroCuotas > 1;
}

/** Demo: 50% 1 cuota, 25% 2 cuotas, 25% 3 cuotas. */
export function assignNumeroCuotasDemo(index: number): number {
  const mod = index % 4;
  if (mod <= 1) return 1;
  if (mod === 2) return 2;
  return 3;
}
