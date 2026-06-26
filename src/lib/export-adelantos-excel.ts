import XLSX from "xlsx-js-style";
import type { DesgloseAdelanto } from "@/lib/adelanto-calculo";
import { esPagoACuotas, modoPagoLabel } from "@/lib/adelanto-calculo";
import { estadoLabel, type Adelanto, type Empresa } from "@/lib/admin-store";

const BRAND = "5B21B6";
const BRAND_LIGHT = "EDE9FE";
const HEADER_FG = "FFFFFF";
const CUOTAS_BG = "FEF3C7";
const CUOTAS_FG = "92400E";
const UNICO_BG = "ECFDF5";
const UNICO_FG = "065F46";
const BORDER = "E2E8F0";

const COLUMNS = [
  "Fecha solicitud",
  "Empleado",
  "Cédula",
  "Empresa",
  "NIT",
  "Monto solicitado",
  "Total a recibir",
  "Cuotas",
  "Modo de pago",
  "Valor cuota",
  "Tarifa comisión",
  "Comisión total",
  "Estado",
  "Banco",
  "Tipo cuenta",
  "Número cuenta",
  "Fecha pago",
  "Motivo rechazo",
] as const;

type ColumnKey = (typeof COLUMNS)[number];

function thinBorder(color = BORDER): XLSX.CellObject["s"] {
  return {
    top: { style: "thin", color: { rgb: color } },
    bottom: { style: "thin", color: { rgb: color } },
    left: { style: "thin", color: { rgb: color } },
    right: { style: "thin", color: { rgb: color } },
  };
}

function cell(value: string | number, style: XLSX.CellObject["s"] = {}): XLSX.CellObject {
  const isNumber = typeof value === "number";
  return {
    v: value,
    t: isNumber ? "n" : "s",
    s: style,
  };
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function filenameStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}-${h}${min}`;
}

function buildRow(
  a: Adelanto,
  empresa: Empresa | undefined,
  desglose: DesgloseAdelanto | undefined,
): Record<ColumnKey, string | number> {
  return {
    "Fecha solicitud": formatFecha(a.fechaSolicitud),
    Empleado: a.empleadoNombre,
    Cédula: a.empleadoCedula,
    Empresa: empresa?.nombre ?? "",
    NIT: empresa?.nit ?? "",
    "Monto solicitado": desglose?.montoSolicitado ?? a.monto,
    "Total a recibir": desglose?.totalARecibir ?? a.monto,
    Cuotas: desglose?.numeroCuotas ?? a.numeroCuotas,
    "Modo de pago": modoPagoLabel(desglose?.numeroCuotas ?? a.numeroCuotas),
    "Valor cuota": desglose?.valorCuota ?? "",
    "Tarifa comisión": desglose?.tarifaComision ?? "",
    "Comisión total": desglose?.valorComision ?? "",
    Estado: estadoLabel[a.estado],
    Banco: a.cuenta.banco,
    "Tipo cuenta": a.cuenta.tipo,
    "Número cuenta": a.cuenta.numero,
    "Fecha pago": a.fechaPago ? formatFecha(a.fechaPago) : "",
    "Motivo rechazo": a.motivoRechazo ?? "",
  };
}

export function exportAdelantosExcel(
  adelantos: Adelanto[],
  empresas: Empresa[],
  calcular?: (monto: number, numeroCuotas: number) => DesgloseAdelanto,
  filenamePrefix = "adelantos",
): void {
  if (!adelantos.length) return;

  const rows = adelantos.map((a) => {
    const empresa = empresas.find((e) => e.id === a.empresaId);
    const desglose = calcular?.(a.monto, a.numeroCuotas);
    return { adelanto: a, desglose, data: buildRow(a, empresa, desglose) };
  });

  const cuotasCount = rows.filter((r) =>
    esPagoACuotas(r.desglose?.numeroCuotas ?? r.adelanto.numeroCuotas),
  ).length;
  const unicoCount = rows.length - cuotasCount;

  const sheet: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  let rowIndex = 0;

  const setRow = (r: number, values: (string | number)[], style: XLSX.CellObject["s"]) => {
    values.forEach((value, c) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      sheet[ref] = cell(value, style);
    });
  };

  setRow(rowIndex, ["CEREBIIA — Reporte de adelantos"], {
    font: { bold: true, sz: 16, color: { rgb: BRAND } },
    alignment: { vertical: "center" },
  });
  merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: COLUMNS.length - 1 } });
  rowIndex++;

  setRow(
    rowIndex,
    [
      `Exportado: ${formatFecha(new Date().toISOString())}  ·  ${rows.length} registro(s)  ·  ${cuotasCount} a cuotas  ·  ${unicoCount} pago único`,
    ],
    {
      font: { sz: 10, color: { rgb: "64748B" } },
      alignment: { vertical: "center" },
    },
  );
  merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: COLUMNS.length - 1 } });
  rowIndex++;

  const legendRow = rowIndex;
  sheet[XLSX.utils.encode_cell({ r: legendRow, c: 0 })] = cell(" ", {
    fill: { fgColor: { rgb: CUOTAS_BG } },
    border: thinBorder(CUOTAS_FG),
    alignment: { horizontal: "center", vertical: "center" },
  });
  sheet[XLSX.utils.encode_cell({ r: legendRow, c: 1 })] = cell("Pago a cuotas (2 o 3 cuotas)", {
    font: { sz: 10, bold: true, color: { rgb: CUOTAS_FG } },
    fill: { fgColor: { rgb: BRAND_LIGHT } },
    alignment: { vertical: "center" },
  });
  merges.push({ s: { r: legendRow, c: 1 }, e: { r: legendRow, c: 4 } });

  sheet[XLSX.utils.encode_cell({ r: legendRow, c: 5 })] = cell(" ", {
    fill: { fgColor: { rgb: UNICO_BG } },
    border: thinBorder(UNICO_FG),
    alignment: { horizontal: "center", vertical: "center" },
  });
  sheet[XLSX.utils.encode_cell({ r: legendRow, c: 6 })] = cell("Pago único (1 cuota)", {
    font: { sz: 10, bold: true, color: { rgb: UNICO_FG } },
    fill: { fgColor: { rgb: BRAND_LIGHT } },
    alignment: { vertical: "center" },
  });
  merges.push({ s: { r: legendRow, c: 6 }, e: { r: legendRow, c: 9 } });
  rowIndex++;

  rowIndex++;

  const headerStyle: XLSX.CellObject["s"] = {
    font: { bold: true, sz: 10, color: { rgb: HEADER_FG } },
    fill: { fgColor: { rgb: BRAND } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder("4C1D95"),
  };

  COLUMNS.forEach((col, c) => {
    const ref = XLSX.utils.encode_cell({ r: rowIndex, c });
    sheet[ref] = cell(col, headerStyle);
  });
  const headerRow = rowIndex;
  rowIndex++;

  const moneyCols = new Set([
    "Monto solicitado",
    "Total a recibir",
    "Valor cuota",
    "Tarifa comisión",
    "Comisión total",
  ]);

  rows.forEach(({ desglose, data }) => {
    const aCuotas = esPagoACuotas(desglose?.numeroCuotas ?? (data.Cuotas as number));
    const rowBg = aCuotas ? CUOTAS_BG : UNICO_BG;
    const rowFg = aCuotas ? CUOTAS_FG : UNICO_FG;

    COLUMNS.forEach((col, c) => {
      const ref = XLSX.utils.encode_cell({ r: rowIndex, c });
      const value = data[col];
      const isMoney = moneyCols.has(col) && typeof value === "number";

      sheet[ref] = cell(value, {
        font: {
          sz: 10,
          color: { rgb: col === "Modo de pago" ? rowFg : "1E293B" },
          bold: col === "Modo de pago" || col === "Total a recibir",
        },
        fill: { fgColor: { rgb: rowBg } },
        alignment: {
          horizontal: isMoney || col === "Cuotas" ? "right" : "left",
          vertical: "center",
          wrapText: col === "Motivo rechazo",
        },
        border: thinBorder(),
        numFmt: isMoney ? '"$"#,##0' : undefined,
      });
    });
    rowIndex++;
  });

  sheet["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: rowIndex - 1, c: COLUMNS.length - 1 },
  });
  sheet["!merges"] = merges;
  sheet["!cols"] = [
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 26 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 8 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 32 },
  ];
  sheet["!rows"] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 22 }, { hpt: 8 }, { hpt: 36 }];

  sheet["!freeze"] = {
    xSplit: 0,
    ySplit: headerRow + 1,
    topLeftCell: "A6",
    activePane: "bottomLeft",
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Adelantos");
  XLSX.writeFile(workbook, `${filenamePrefix}-filtrado-${filenameStamp()}.xlsx`);
}
