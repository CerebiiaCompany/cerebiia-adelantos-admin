import type { Adelanto, Empleado } from "@/lib/admin-store";
import { calcularSaldoDisponible, empleadoCoincideAdelanto } from "@/lib/admin-store";
import { calcularDesgloseAdelanto } from "@/lib/adelanto-calculo";
import type { ResumenCobroEmpresa } from "@/lib/cuenta-cobro";
import { periodoLabel } from "@/lib/cuenta-cobro";

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
  /** Cuota que se informa o descontó en esta cuenta de cobro (1 … N). */
  numeroCuota: number;
  totalCuotas: number;
  /** Monto total solicitado en el adelanto. */
  montoSolicitado: number;
  /** Neto que recibió el empleado (adelanto − comisión total). */
  montoARecibir: number;
  /** Valor descontado en nómina por esta cuota. */
  valorDescuentoNomina: number;
  /** Comisión total del adelanto (tarifa × número de cuotas). */
  comisionTotal: number;
  /** Tarifa fija de comisión por cuota (config. super admin). */
  tarifaComision: number;
  estado: EstadoCuota | "a_informar";
  periodoDescuento?: string;
  fechaDescuento?: string;
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

export function descontarSiguienteCuota(
  registro: RegistroCuota[],
  cuentaCobroId: string,
  periodo: string,
): RegistroCuota[] {
  const pendiente = registro.find((c) => c.estado === "pendiente");
  if (!pendiente) return registro;

  return registro.map((c) =>
    c.numero === pendiente.numero
      ? {
          ...c,
          estado: "descontada" as const,
          periodoDescuento: periodo,
          fechaDescuento: new Date().toISOString(),
          cuentaCobroId,
        }
      : c,
  );
}

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
    registroCuotas: descontarSiguienteCuota(base, cuentaCobroId, periodo),
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
    if (!a.cuotasActivadas) {
      const d = calcularDesgloseAdelanto(a.monto, a.numeroCuotas, valorComision);
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

export function contarCuotasFuturas(
  adelantos: Adelanto[],
  valorComision: string | number,
): number {
  let total = 0;
  for (const a of adelantos) {
    const registro = obtenerRegistroCuotas(a, valorComision);
    const pendientes = registro.filter((c) => c.estado === "pendiente").length;
    total += Math.max(0, pendientes > 0 ? pendientes - 1 : 0);
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

  for (const a of resumen.adelantosPagados) {
    const desglose = calcularDesgloseAdelanto(a.monto, a.numeroCuotas, valorComision);
    const registro = obtenerRegistroCuotas(a, valorComision);
    const totalCuotas = registro.length || desglose.numeroCuotas;

    const descontadaEnCuenta =
      cuentaVerificada && cuenta
        ? registro.find((c) => c.cuentaCobroId === cuenta.id)
        : undefined;

    const primeraPendiente = registro.find((c) => c.estado === "pendiente");
    const numeroCuota = descontadaEnCuenta?.numero ?? primeraPendiente?.numero ?? 1;

    let estado: FilaDetalleCuota["estado"];
    if (descontadaEnCuenta) {
      estado = "descontada";
    } else if (primeraPendiente) {
      estado = cuentaVerificada ? "pendiente" : "a_informar";
    } else {
      estado = "descontada";
    }

    filas.push({
      adelantoId: a.id,
      empleadoNombre: a.empleadoNombre,
      empleadoCedula: a.empleadoCedula,
      numeroCuota,
      totalCuotas,
      montoSolicitado: desglose.montoSolicitado,
      montoARecibir: desglose.totalARecibir,
      valorDescuentoNomina: desglose.valorCuota,
      comisionTotal: desglose.valorComision,
      tarifaComision: desglose.tarifaComision,
      estado,
      periodoDescuento: descontadaEnCuenta?.periodoDescuento,
      fechaDescuento: descontadaEnCuenta?.fechaDescuento,
    });
  }

  return filas.sort((a, b) => {
    const name = a.empleadoNombre.localeCompare(b.empleadoNombre);
    if (name !== 0) return name;
    return a.numeroCuota - b.numeroCuota;
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
