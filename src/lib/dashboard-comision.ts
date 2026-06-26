import { calcularDesgloseAdelanto } from "@/lib/adelanto-calculo";
import type { Adelanto } from "@/lib/admin-store";

function monthKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string): string {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

export function comisionAdelantoPagado(
  adelanto: Adelanto,
  valorComision: string | number,
): number {
  if (adelanto.estado !== "pagado") return 0;
  return calcularDesgloseAdelanto(
    adelanto.monto,
    adelanto.numeroCuotas,
    valorComision,
  ).valorComision;
}

export function gananciaComisionPorMes(
  adelantos: Adelanto[],
  valorComision: string | number,
  refDate = new Date(),
): { total: number; cantidad: number; mesKey: string; mesLabel: string } {
  const mesKey = monthKeyFromDate(refDate);
  const pagadosMes = adelantos.filter((a) => {
    if (a.estado !== "pagado") return false;
    const fecha = a.fechaPago ?? a.fechaSolicitud;
    return monthKeyFromDate(new Date(fecha)) === mesKey;
  });

  const total = pagadosMes.reduce(
    (sum, a) => sum + comisionAdelantoPagado(a, valorComision),
    0,
  );

  return {
    total,
    cantidad: pagadosMes.length,
    mesKey,
    mesLabel: monthLabelFromKey(mesKey),
  };
}

export function gananciaComisionHistorialMensual(
  adelantos: Adelanto[],
  valorComision: string | number,
  monthCount = 6,
): { key: string; label: string; total: number; cantidad: number }[] {
  const now = new Date();
  const keys: string[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKeyFromDate(d));
  }

  return keys.map((key) => {
    const pagados = adelantos.filter((a) => {
      if (a.estado !== "pagado") return false;
      const fecha = a.fechaPago ?? a.fechaSolicitud;
      return monthKeyFromDate(new Date(fecha)) === key;
    });

    const [y, m] = key.split("-");
    const shortLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-CO", {
      month: "short",
    }).replace(".", "");

    return {
      key,
      label: shortLabel,
      total: pagados.reduce((s, a) => s + comisionAdelantoPagado(a, valorComision), 0),
      cantidad: pagados.length,
    };
  });
}
