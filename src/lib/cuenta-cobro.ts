import type { Adelanto, Empresa } from "@/lib/admin-store";
import { calcularDesgloseAdelanto } from "@/lib/adelanto-calculo";

export type EstadoCuentaCobro =
  | "borrador"
  | "emitida"
  | "evidencia_enviada"
  | "verificada"
  | "rechazada";

export type CuentaCobro = {
  id: string;
  empresaId: string;
  periodo: string;
  adelantoIds: string[];
  montoPagado: number;
  montoComision: number;
  montoTotalCobrar: number;
  documentoCobroNombre?: string;
  fechaEmision: string;
  evidenciaPagoNombre?: string;
  fechaEvidencia?: string;
  estado: EstadoCuentaCobro;
  notaRevision?: string;
  fechaVerificacion?: string;
};

export const estadoCuentaCobroLabel: Record<EstadoCuentaCobro, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  evidencia_enviada: "Evidencia recibida",
  verificada: "Verificada",
  rechazada: "Rechazada",
};

export const ESTADO_CUENTA_COBRO_CLASSES: Record<EstadoCuentaCobro, string> = {
  borrador: "bg-muted/50 text-muted-foreground border-border",
  emitida: "bg-info/15 text-info border-info/30",
  evidencia_enviada: "bg-warning/15 text-warning border-warning/30",
  verificada: "bg-success/15 text-success border-success/30",
  rechazada: "bg-destructive/15 text-destructive border-destructive/30",
};

export function periodoFromDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function periodoLabel(periodo: string): string {
  const [y, m] = periodo.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

export type ResumenCobroEmpresa = {
  key: string;
  empresaId: string;
  periodo: string;
  empresa?: Empresa;
  adelantosPagados: Adelanto[];
  cantidadAdelantos: number;
  montoPagado: number;
  montoComision: number;
  montoTotalCobrar: number;
  cuentaCobro?: CuentaCobro;
};

export function calcularMontosCobro(
  adelantos: Adelanto[],
  valorComision: string | number,
): Pick<ResumenCobroEmpresa, "montoPagado" | "montoComision" | "montoTotalCobrar"> {
  let montoPagado = 0;
  let montoComision = 0;

  for (const a of adelantos) {
    const d = calcularDesgloseAdelanto(a.monto, a.numeroCuotas, valorComision);
    montoPagado += d.totalARecibir;
    montoComision += d.valorComision;
  }

  return {
    montoPagado,
    montoComision,
    montoTotalCobrar: montoPagado + montoComision,
  };
}

export function buildResumenesCobroEmpresa(
  adelantos: Adelanto[],
  empresas: Empresa[],
  cuentasCobro: CuentaCobro[],
  periodo: string,
  valorComision: string | number,
): ResumenCobroEmpresa[] {
  const pagados = adelantos.filter((a) => {
    if (a.estado !== "pagado") return false;
    const ref = a.fechaPago ?? a.fechaSolicitud;
    return periodoFromDate(ref) === periodo;
  });

  const porEmpresa = new Map<string, Adelanto[]>();
  for (const a of pagados) {
    const list = porEmpresa.get(a.empresaId) ?? [];
    list.push(a);
    porEmpresa.set(a.empresaId, list);
  }

  const cuentasPorKey = new Map(
    cuentasCobro.filter((c) => c.periodo === periodo).map((c) => [`${c.empresaId}:${c.periodo}`, c]),
  );

  const resumenes: ResumenCobroEmpresa[] = [];

  for (const [empresaId, lista] of porEmpresa) {
    const montos = calcularMontosCobro(lista, valorComision);
    const key = `${empresaId}:${periodo}`;
    resumenes.push({
      key,
      empresaId,
      periodo,
      empresa: empresas.find((e) => e.id === empresaId),
      adelantosPagados: lista,
      cantidadAdelantos: lista.length,
      cuentaCobro: cuentasPorKey.get(key),
      ...montos,
    });
  }

  return resumenes.sort((a, b) => b.montoTotalCobrar - a.montoTotalCobrar);
}

export function listarPeriodosConPagos(adelantos: Adelanto[]): string[] {
  const set = new Set<string>();
  for (const a of adelantos) {
    if (a.estado !== "pagado") continue;
    set.add(periodoFromDate(a.fechaPago ?? a.fechaSolicitud));
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export type TarjetaCobroEmpresa = {
  empresa?: Empresa;
  count: number;
  total: number;
  aprobado: number;
  verificada: boolean;
};

/** Tarjetas "Total a cobrar por empresa": $0 cuando el pago de la empresa ya fue verificado. */
export function buildTarjetasCobroPorEmpresa(resumenes: ResumenCobroEmpresa[]): TarjetaCobroEmpresa[] {
  return resumenes.map((r) => {
    const verificada = r.cuentaCobro?.estado === "verificada";
    const pendienteEvidencia = r.cuentaCobro?.estado === "evidencia_enviada";
    return {
      empresa: r.empresa,
      count: r.cantidadAdelantos,
      total: verificada ? 0 : r.montoTotalCobrar,
      aprobado: pendienteEvidencia ? r.montoTotalCobrar : 0,
      verificada,
    };
  });
}

export function totalCobroPendiente(resumenes: ResumenCobroEmpresa[]): number {
  return resumenes
    .filter((r) => r.cuentaCobro?.estado !== "verificada")
    .reduce((s, r) => s + r.montoTotalCobrar, 0);
}
