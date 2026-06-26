import type { Adelanto, Empleado } from "@/lib/admin-store";
import { calcularSaldoDisponible, empleadoCoincideAdelanto } from "@/lib/admin-store";
import { calcularDesgloseAdelanto } from "@/lib/adelanto-calculo";
import type { CuentaCobro, ResumenCobroEmpresa } from "@/lib/cuenta-cobro";
import { periodoFromDate, periodoLabel } from "@/lib/periodo";

export type EstadoCuota = "pendiente" | "descontada";

export type RegistroCuota = {
  numero: number;
  valor: number;
  estado: EstadoCuota;
  periodoDescuento?: string;
  fechaDescuento?: string;
  cuentaCobroId?: string;
};

export type FilaDetalleCuota = {
  adelantoId: string;
  empleadoNombre: string;
  empleadoCedula: string;
  fechaSolicitud: string;
  totalCuotas: number;
  montoSolicitado: number;
  montoARecibir: number;
  /** Valor mensual a descontar en nómina. */
  valorDescuentoNomina: number;
  periodoInicioDescuento: string;
  comisionTotal: number;
  tarifaComision: number;
  estado: "a_informar" | "cobro_saldado";
};

export type ResumenSaldoEmpleado = {
  empleadoNombre: string;
  empleadoCedula: string;
  saldoBase: number;
  comprometido: number;
  saldoDisponible: number;
  cuotasDescontadas: number;
  cuotasPendientes: number;
};

/** Monto completo a cobrar a la empresa por el adelanto (neto + comisión total). */
export function calcularMontoCobroAdelanto(
  adelanto: Adelanto,
  valorComision: string | number,
): { montoPagado: number; montoComision: number; montoTotalCobrar: number } {
  const d = calcularDesgloseAdelanto(adelanto.monto, adelanto.numeroCuotas, valorComision);
  return {
    montoPagado: d.totalARecibir,
    montoComision: d.valorComision,
    montoTotalCobrar: d.totalARecibir + d.valorComision,
  };
}

/** @deprecated Usar calcularMontoCobroAdelanto */
export const calcularMontoCobroCuotaAdelanto = calcularMontoCobroAdelanto;

/** La empresa ya pagó y el super admin verificó la evidencia: deuda = $0. */
export function cuentaCobroVerificadaParaAdelanto(
  adelanto: Adelanto,
  cuentasCobro: CuentaCobro[],
): boolean {
  return cuentasCobro.some(
    (c) => c.estado === "verificada" && c.adelantoIds.includes(adelanto.id),
  );
}

export function adelantoCobroEmpresaSaldado(
  adelanto: Adelanto,
  cuentasCobro?: CuentaCobro[],
): boolean {
  if (cuentasCobro?.length) {
    return cuentaCobroVerificadaParaAdelanto(adelanto, cuentasCobro);
  }
  return adelanto.cobroEmpresaVerificado === true;
}

/**
 * Un adelanto se cobra a la empresa una sola vez, en el periodo en que fue pagado al empleado.
 * El saldo solo queda en $0 cuando la cuenta de cobro está verificada.
 */
export function adelantoDebeCobrarseEnPeriodo(
  adelanto: Adelanto,
  periodo: string,
  cuentasCobro?: CuentaCobro[],
): boolean {
  if (adelanto.estado !== "pagado") return false;
  if (adelantoCobroEmpresaSaldado(adelanto, cuentasCobro)) return false;
  const periodoPago = periodoFromDate(adelanto.fechaPago ?? adelanto.fechaSolicitud);
  return periodo === periodoPago;
}

export function listarPeriodosCobro(adelantos: Adelanto[]): string[] {
  const set = new Set<string>();

  for (const a of adelantos) {
    if (a.estado !== "pagado") continue;
    set.add(periodoFromDate(a.fechaPago ?? a.fechaSolicitud));
  }

  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export function inicializarRegistroCuotas(
  adelanto: Adelanto,
  valorComision: string | number,
): RegistroCuota[] {
  const { numeroCuotas, valorCuota } = calcularDesgloseAdelanto(
    adelanto.monto,
    adelanto.numeroCuotas,
    valorComision,
  );
  return Array.from({ length: numeroCuotas }, (_, i) => ({
    numero: i + 1,
    valor: valorCuota,
    estado: "pendiente" as const,
  }));
}

export function obtenerRegistroCuotas(
  adelanto: Adelanto,
  valorComision: string | number,
): RegistroCuota[] {
  if (adelanto.registroCuotas?.length) return adelanto.registroCuotas;
  if (adelanto.estado === "pagado") {
    return inicializarRegistroCuotas(adelanto, valorComision);
  }
  return [];
}

/** Al verificar el cobro: deuda con empresa = $0; cuotas quedan solo para descuento en nómina. */
export function aplicarCuotasPorVerificacion(
  adelanto: Adelanto,
  cuentaCobroId: string,
  periodo: string,
  valorComision: string | number,
): Adelanto {
  const base = adelanto.registroCuotas?.length
    ? adelanto.registroCuotas
    : inicializarRegistroCuotas(adelanto, valorComision);

  return {
    ...adelanto,
    cuotasActivadas: true,
    cobroEmpresaVerificado: true,
    fechaCobroEmpresa: new Date().toISOString(),
    cuentaCobroId,
    periodoInicioDescuento: periodo,
    registroCuotas: base,
  };
}

export function calcularSaldoDisponibleNeto(
  empleado: Empleado,
  adelantos: Adelanto[],
  valorComision: string | number,
): ResumenSaldoEmpleado {
  const saldoBase = calcularSaldoDisponible(empleado.salario);
  const delEmpleado = adelantos.filter(
    (a) => empleadoCoincideAdelanto(empleado, a) && a.estado === "pagado",
  );

  let comprometido = 0;
  let cuotasDescontadas = 0;
  let cuotasPendientes = 0;

  for (const a of delEmpleado) {
    const d = calcularDesgloseAdelanto(a.monto, a.numeroCuotas, valorComision);

    if (!a.cuotasActivadas) {
      comprometido += d.montoSolicitado;
      cuotasPendientes += d.numeroCuotas;
      continue;
    }

    const registro = obtenerRegistroCuotas(a, valorComision);
    for (const c of registro) {
      if (c.estado === "pendiente") {
        comprometido += c.valor;
        cuotasPendientes++;
      } else {
        cuotasDescontadas++;
      }
    }
  }

  return {
    empleadoNombre: empleado.nombre,
    empleadoCedula: empleado.documento,
    saldoBase,
    comprometido,
    saldoDisponible: Math.max(0, saldoBase - comprometido),
    cuotasDescontadas,
    cuotasPendientes,
  };
}

/** Total de cuotas mensuales que la empresa debe descontar en nómina (informativo). */
export function sumarCuotasNominaInformadas(
  adelantos: Adelanto[],
  valorComision: string | number,
): number {
  let total = 0;
  for (const a of adelantos) {
    const d = calcularDesgloseAdelanto(a.monto, a.numeroCuotas, valorComision);
    total += d.numeroCuotas;
  }
  return total;
}

export function buildFilasDetalleCuotas(
  resumen: ResumenCobroEmpresa,
  valorComision: string | number,
): FilaDetalleCuota[] {
  const filas: FilaDetalleCuota[] = [];
  const cuenta = resumen.cuentaCobro;
  const cuentaVerificada = cuenta?.estado === "verificada";
  const periodoCobro = resumen.periodo;

  for (const a of resumen.adelantosPagados) {
    const desglose = calcularDesgloseAdelanto(a.monto, a.numeroCuotas, valorComision);
    const periodoInicio =
      a.periodoInicioDescuento ??
      (cuentaVerificada && cuenta ? cuenta.periodo : periodoCobro);

    filas.push({
      adelantoId: a.id,
      empleadoNombre: a.empleadoNombre,
      empleadoCedula: a.empleadoCedula,
      fechaSolicitud: a.fechaSolicitud,
      totalCuotas: desglose.numeroCuotas,
      montoSolicitado: desglose.montoSolicitado,
      montoARecibir: desglose.totalARecibir,
      valorDescuentoNomina: desglose.valorCuota,
      periodoInicioDescuento: periodoInicio,
      comisionTotal: desglose.valorComision,
      tarifaComision: desglose.tarifaComision,
      estado: cuentaVerificada ? "cobro_saldado" : "a_informar",
    });
  }

  return filas.sort((a, b) => {
    const byDate = a.fechaSolicitud.localeCompare(b.fechaSolicitud);
    if (byDate !== 0) return byDate;
    return a.empleadoNombre.localeCompare(b.empleadoNombre);
  });
}

export function buildResumenSaldosEmpresa(
  resumen: ResumenCobroEmpresa,
  empleados: Empleado[],
  adelantos: Adelanto[],
  valorComision: string | number,
): ResumenSaldoEmpleado[] {
  const cedulas = new Set(resumen.adelantosPagados.map((a) => a.empleadoCedula));
  const nombres = new Map(resumen.adelantosPagados.map((a) => [a.empleadoCedula, a.empleadoNombre]));

  const saldos: ResumenSaldoEmpleado[] = [];

  for (const cedula of cedulas) {
    const emp =
      empleados.find(
        (e) => e.empresaId === resumen.empresaId && e.documento === cedula,
      ) ??
      ({
        id: `tmp-${cedula}`,
        empresaId: resumen.empresaId,
        nombre: nombres.get(cedula) ?? "Empleado",
        documento: cedula,
        salario: 2000000,
        tipoDocumento: "CC",
        banco: "",
        numeroCuenta: "",
        tipoCuenta: "Ahorros",
        email: "",
        celular: "",
        tipoContrato: "Término Indefinido",
      } as Empleado);

    saldos.push(calcularSaldoDisponibleNeto(emp, adelantos, valorComision));
  }

  return saldos.sort((a, b) => a.empleadoNombre.localeCompare(b.empleadoNombre));
}

export function formatPeriodoDescuento(periodo?: string): string {
  if (!periodo) return "—";
  return periodoLabel(periodo);
}

export function formatFechaSolicitud(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
