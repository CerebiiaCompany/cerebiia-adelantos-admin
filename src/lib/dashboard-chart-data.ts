import type { Adelanto, Empresa, EstadoAdelanto } from "@/lib/admin-store";

export type MonthlyTrendPoint = {
  key: string;
  label: string;
  total: number;
  cantidad: number;
  pagado: number;
  aprobado: number;
  en_revision: number;
  solicitado: number;
  rechazado: number;
};

export type EmpresaBarPoint = {
  id: string;
  nombre: string;
  nombreCorto: string;
  activa: boolean;
  total: number;
  cantidad: number;
};

const ESTADOS: EstadoAdelanto[] = [
  "pagado",
  "aprobado",
  "en_revision",
  "solicitado",
  "rechazado",
];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shortMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-CO", { month: "short" }).replace(".", "");
}

function truncateName(name: string, max = 14) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

export function buildMonthlyTrend(adelantos: Adelanto[], monthCount = 6): MonthlyTrendPoint[] {
  const now = new Date();
  const keys: string[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }

  return keys.map((key) => {
    const list = adelantos.filter((a) => monthKey(new Date(a.fechaSolicitud)) === key);
    const byEstado = Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<
      EstadoAdelanto,
      number
    >;

    for (const a of list) {
      byEstado[a.estado] += a.monto;
    }

    return {
      key,
      label: shortMonthLabel(key),
      total: list.reduce((s, a) => s + a.monto, 0),
      cantidad: list.length,
      pagado: byEstado.pagado,
      aprobado: byEstado.aprobado,
      en_revision: byEstado.en_revision,
      solicitado: byEstado.solicitado,
      rechazado: byEstado.rechazado,
    };
  });
}

export function buildEmpresaBars(empresas: Empresa[], adelantos: Adelanto[]): EmpresaBarPoint[] {
  return empresas
    .map((empresa) => {
      const list = adelantos.filter((a) => a.empresaId === empresa.id);
      return {
        id: empresa.id,
        nombre: empresa.nombre,
        nombreCorto: truncateName(empresa.nombre),
        activa: empresa.activa,
        total: list.reduce((s, a) => s + a.monto, 0),
        cantidad: list.length,
      };
    })
    .filter((x) => x.total > 0 || x.cantidad > 0)
    .sort((a, b) => b.total - a.total);
}

export function formatChartAxisMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}
