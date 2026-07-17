import XLSX from "xlsx-js-style";
import type { ReferenciaNominaApi } from "@/lib/api/types";

const BRAND = "166534";
const HEADER_FG = "FFFFFF";
const TOTAL_BG = "DCFCE7";
const BORDER = "CBD5E1";

function thinBorder(): XLSX.CellObject["s"] {
  return {
    top: { style: "thin", color: { rgb: BORDER } },
    bottom: { style: "thin", color: { rgb: BORDER } },
    left: { style: "thin", color: { rgb: BORDER } },
    right: { style: "thin", color: { rgb: BORDER } },
  };
}

function headerCell(value: string): XLSX.CellObject {
  return {
    v: value,
    t: "s",
    s: {
      font: { bold: true, color: { rgb: HEADER_FG }, sz: 11 },
      fill: { patternType: "solid", fgColor: { rgb: BRAND } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      ...thinBorder(),
    },
  };
}

function textCell(
  value: string | number,
  opts?: { money?: boolean; total?: boolean },
): XLSX.CellObject {
  const isNumber = typeof value === "number";
  return {
    v: value,
    t: isNumber ? "n" : "s",
    z: opts?.money ? '"$"#,##0.00' : undefined,
    s: {
      font: { sz: 10, bold: Boolean(opts?.total) },
      fill: opts?.total
        ? { patternType: "solid", fgColor: { rgb: TOTAL_BG } }
        : undefined,
      alignment: { vertical: "center" },
      ...thinBorder(),
    },
  };
}

function money(value: string | number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function filenameStamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Excel de referencia de nómina (plantilla multi-cuota).
 *
 * Hoja 1 — Resumen: 1 fila por empleado + fila TOTAL.
 * Hoja 2 — Detalle cuotas: 1 fila por cuota a descontar.
 */
export function exportReferenciaNominaExcel(data: ReferenciaNominaApi) {
  const wb = XLSX.utils.book_new();

  const resumenHeaders = [
    "Inicio Periodo",
    "Fin Periodo",
    "Número Documento",
    "Nombre",
    "Apellido",
    "# Adelantos",
    "Total Cuotas",
    "Total Costo de Servicio",
    "Total Neto Transferido",
    "Total Solicitado",
    "Total a Descontar Este Mes",
    "Total a Pagar al Proveedor",
  ];

  const totales = data.totales ?? {
    cantidad_adelantos: data.resumen.reduce((a, r) => a + r.cantidad_adelantos, 0),
    total_cuotas: data.resumen.reduce((a, r) => a + (r.total_cuotas ?? 0), 0),
    total_costo_servicio: String(
      data.resumen.reduce((a, r) => a + money(r.total_costo_servicio), 0),
    ),
    total_neto_transferido: String(
      data.resumen.reduce((a, r) => {
        const neto =
          r.total_neto_transferido != null
            ? money(r.total_neto_transferido)
            : money(r.total_solicitado) - money(r.total_costo_servicio);
        return a + neto;
      }, 0),
    ),
    total_solicitado: String(
      data.resumen.reduce((a, r) => a + money(r.total_solicitado), 0),
    ),
    total_a_descontar_mes: String(
      data.resumen.reduce((a, r) => a + money(r.total_a_descontar_mes), 0),
    ),
    total_a_pagar_proveedor: String(
      data.resumen.reduce((a, r) => a + money(r.total_a_descontar_mes), 0),
    ),
  };

  const resumenAoA: XLSX.CellObject[][] = [
    resumenHeaders.map((h) => headerCell(h)),
    ...data.resumen.map((r) => {
      const descontarMes = money(r.total_a_descontar_mes);
      const pagarProveedor =
        r.total_a_pagar_proveedor != null
          ? money(r.total_a_pagar_proveedor)
          : descontarMes;
      const desgloseCuotas =
        r.detalle_cuotas?.trim() ||
        (r.total_cuotas != null ? String(r.total_cuotas) : "0");
      const netoTransferido =
        r.total_neto_transferido != null
          ? money(r.total_neto_transferido)
          : money(r.total_solicitado) - money(r.total_costo_servicio);
      return [
        textCell(r.inicio_periodo),
        textCell(r.fin_periodo),
        textCell(r.numero_documento),
        textCell(r.nombre),
        textCell(r.apellido),
        textCell(r.cantidad_adelantos),
        textCell(desgloseCuotas),
        textCell(money(r.total_costo_servicio), { money: true }),
        textCell(netoTransferido, { money: true }),
        textCell(money(r.total_solicitado), { money: true }),
        textCell(descontarMes, { money: true }),
        textCell(pagarProveedor, { money: true }),
      ];
    }),
    [
      textCell("TOTAL", { total: true }),
      textCell("", { total: true }),
      textCell("", { total: true }),
      textCell("", { total: true }),
      textCell("", { total: true }),
      textCell(money(totales.cantidad_adelantos), { total: true }),
      textCell(money(totales.total_cuotas ?? 0), { total: true }),
      textCell(money(totales.total_costo_servicio), { money: true, total: true }),
      textCell(money(totales.total_neto_transferido ?? 0), { money: true, total: true }),
      textCell(money(totales.total_solicitado), { money: true, total: true }),
      textCell(money(totales.total_a_descontar_mes), { money: true, total: true }),
      textCell(money(totales.total_a_pagar_proveedor), { money: true, total: true }),
    ],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenAoA);
  wsResumen["!cols"] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen por empleado");

  const detalleHeaders = [
    "Inicio Periodo",
    "Fin Periodo",
    "Número Documento",
    "Nombre",
    "Apellido",
    "Cuota #",
    "Total Cuotas",
    "Fecha Corte",
    "Monto a Descontar Nómina",
    "Monto Solicitud",
    "Costo Servicio Cuota",
    "Estado Cuota",
  ];

  const detalleAoA: XLSX.CellObject[][] = [
    detalleHeaders.map((h) => headerCell(h)),
    ...data.detalle.map((d) => [
      textCell(d.inicio_periodo),
      textCell(d.fin_periodo),
      textCell(d.numero_documento),
      textCell(d.nombre),
      textCell(d.apellido),
      textCell(`${d.cuota_numero} de ${d.total_cuotas}`),
      textCell(d.total_cuotas),
      textCell(d.fecha_corte),
      textCell(money(d.monto_a_descontar), { money: true }),
      textCell(money(d.monto_solicitud), { money: true }),
      textCell(money(d.tarifa_cuota), { money: true }),
      textCell(d.estado_cuota),
    ]),
  ];

  const wsDetalle = XLSX.utils.aoa_to_sheet(detalleAoA);
  wsDetalle["!cols"] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle cuotas");

  const safeName = data.empresa_nombre.replace(/[^\w\-]+/g, "_").slice(0, 40);
  XLSX.writeFile(wb, `referencia-nomina-${safeName}-${data.periodo}-${filenameStamp()}.xlsx`);
}
