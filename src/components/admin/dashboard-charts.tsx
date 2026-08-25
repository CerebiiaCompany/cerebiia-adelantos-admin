import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { MonthlyTrendPoint, EmpresaBarPoint } from "@/lib/dashboard-chart-data";
import type { Adelanto, Empresa } from "@/lib/admin-store";
import { formatCOP } from "@/lib/admin-store";
import {
  buildEmpresaBars,
  buildMonthlyTrend,
  formatChartAxisMoney,
} from "@/lib/dashboard-chart-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Layers, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

type DashboardChartsProps = {
  adelantos: Adelanto[];
  empresas: Empresa[];
  animationKey?: number;
  className?: string;
};

const ESTADO_CONFIG = {
  pagado: {
    label: "Pagado",
    color: "#10B981", // Emerald 500
    gradient: ["#34D399", "#059669"],
    icon: CheckCircle2,
  },
  aprobado: {
    label: "Aprobado",
    color: "#6366F1", // Indigo 500
    gradient: ["#818CF8", "#4F46E5"],
    icon: Clock,
  },
  en_revision: {
    label: "En revisión",
    color: "#8B5CF6", // Violet 500
    gradient: ["#A78BFA", "#7C3AED"],
    icon: Clock,
  },
  solicitado: {
    label: "Solicitado",
    color: "#3B82F6", // Blue 500
    gradient: ["#60A5FA", "#2563EB"],
    icon: Clock,
  },
  rechazado: {
    label: "Rechazado",
    color: "#F43F5E", // Rose 500
    gradient: ["#FB7185", "#E11D48"],
    icon: XCircle,
  },
} as const;

type EstadoKey = keyof typeof ESTADO_CONFIG;
const ESTADO_KEYS: EstadoKey[] = ["pagado", "aprobado", "en_revision", "solicitado", "rechazado"];

const EMPRESA_BAR_COLORS = [
  { start: "#8B5CF6", end: "#6D28D9" }, // Violet
  { start: "#6366F1", end: "#4338CA" }, // Indigo
  { start: "#3B82F6", end: "#1D4ED8" }, // Blue
  { start: "#06B6D4", end: "#0E7490" }, // Cyan
  { start: "#EC4899", end: "#BE185D" }, // Pink
  { start: "#10B981", end: "#047857" }, // Emerald
];

export function DashboardTrendChart({
  adelantos,
  trendData,
  animationKey = 0,
  className,
}: Pick<DashboardChartsProps, "adelantos" | "animationKey" | "className"> & {
  trendData?: MonthlyTrendPoint[];
}) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"stacked" | "area" | "count">("stacked");

  const data = useMemo(
    () => trendData ?? buildMonthlyTrend(adelantos),
    [trendData, adelantos],
  );

  const peak = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data]);
  const peakCount = useMemo(() => Math.max(...data.map((d) => d.cantidad), 1), [data]);

  const activeEstados = useMemo(() => {
    return ESTADO_KEYS.filter((key) => data.some((d) => Number(d[key]) > 0));
  }, [data]);

  // Resumen global para el encabezado
  const summary = useMemo(() => {
    const totalMonto = data.reduce((sum, d) => sum + d.total, 0);
    const totalSolicitudes = data.reduce((sum, d) => sum + d.cantidad, 0);
    const totalPagado = data.reduce((sum, d) => sum + d.pagado, 0);
    const efectividad = totalMonto > 0 ? (totalPagado / totalMonto) * 100 : 0;

    return { totalMonto, totalSolicitudes, totalPagado, efectividad };
  }, [data]);

  return (
    <div className={cn("admin-panel-card relative overflow-hidden transition-all duration-300", className)}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER DE LA GRÁFICA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 grid place-items-center shadow-xs">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <h2 className="admin-section-title text-lg font-bold text-slate-800 dark:text-slate-100">
                Evolución de adelantos
              </h2>
              <p className="admin-section-subtitle text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Monto distribuido por estado y volumen mensual de solicitudes.
              </p>
            </div>
          </div>
        </div>

        {/* SELECTOR DE VISTAS DINÁMICAS (TABS) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/50 self-start sm:self-auto shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("stacked")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              viewMode === "stacked"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs ring-1 ring-black/5"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
            title="Ver desglose por estados"
          >
            <Layers className="size-3.5" />
            <span>Estados</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("area")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              viewMode === "area"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs ring-1 ring-black/5"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
            title="Ver tendencia de volumen continuo"
          >
            <Activity className="size-3.5" />
            <span>Volumen</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("count")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              viewMode === "count"
                ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs ring-1 ring-black/5"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
            title="Ver cantidad de solicitudes"
          >
            <BarChart3 className="size-3.5" />
            <span>Solicitudes</span>
          </button>
        </div>
      </div>

      {/* KPI PILLS RESUMEN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        <div className="px-3.5 py-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
          <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Total Solicitado
          </p>
          <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
            {formatCOP(summary.totalMonto)}
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Total Pagado
          </p>
          <p className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
            {formatCOP(summary.totalPagado)}
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
          <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Solicitudes
          </p>
          <p className="text-sm sm:text-base font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums">
            {summary.totalSolicitudes} {summary.totalSolicitudes === 1 ? "unidad" : "totales"}
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Tasa de Cobro
          </p>
          <p className="text-sm sm:text-base font-extrabold text-blue-700 dark:text-blue-300 tabular-nums">
            {summary.efectividad.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* ÁREA DE GRÁFICA */}
      <div className="h-[280px] sm:h-[320px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "stacked" ? (
            <ComposedChart
              key={`stacked-${animationKey}`}
              data={data}
              margin={{ top: 12, right: isMobile ? 8 : 16, left: isMobile ? -8 : 4, bottom: 4 }}
            >
              <defs>
                {ESTADO_KEYS.map((key) => {
                  const conf = ESTADO_CONFIG[key];
                  return (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={conf.gradient[0]} stopOpacity={1} />
                      <stop offset="100%" stopColor={conf.gradient[1]} stopOpacity={0.9} />
                    </linearGradient>
                  );
                })}
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs font-semibold fill-slate-500 dark:fill-slate-400 capitalize"
              />

              <YAxis
                yAxisId="monto"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={isMobile ? 42 : 56}
                tickFormatter={formatChartAxisMoney}
                className="text-xs font-medium fill-slate-400 dark:fill-slate-500"
                domain={[0, Math.ceil(peak * 1.15)]}
              />

              <YAxis
                yAxisId="cantidad"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={isMobile ? 24 : 32}
                allowDecimals={false}
                className="text-xs font-semibold fill-purple-500"
                domain={[0, Math.ceil(peakCount * 1.25)]}
              />

              {/* TOOLTIP GLASSMORPHISM */}
              <Tooltip
                cursor={{ fill: "rgba(124, 58, 237, 0.05)", stroke: "rgba(124, 58, 237, 0.2)", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as MonthlyTrendPoint;
                  if (!row) return null;

                  return (
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur-md min-w-[240px] text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 capitalize">
                          {label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold">
                          {row.cantidad} {row.cantidad === 1 ? "solicitud" : "solicitudes"}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {activeEstados.map((key) => {
                          const val = Number(row[key]);
                          if (val <= 0) return null;
                          const conf = ESTADO_CONFIG[key];
                          const pct = row.total > 0 ? (val / row.total) * 100 : 0;

                          return (
                            <div key={key} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="size-2.5 rounded-full shadow-xs"
                                  style={{ backgroundColor: conf.color }}
                                />
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                  {conf.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-[10px]">
                                  {pct.toFixed(0)}%
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                                  {formatCOP(val)}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2 flex items-center justify-between font-extrabold text-slate-900 dark:text-white">
                          <span>Total del mes</span>
                          <span className="text-purple-600 dark:text-purple-400 tabular-nums">
                            {formatCOP(row.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              {activeEstados.map((key, index) => {
                const isTop = index === activeEstados.length - 1;
                return (
                  <Bar
                    key={key}
                    yAxisId="monto"
                    dataKey={key}
                    stackId="estado"
                    fill={`url(#grad-${key})`}
                    radius={isTop ? [8, 8, 0, 0] : undefined}
                    maxBarSize={48}
                    isAnimationActive
                  />
                );
              })}

              <Line
                yAxisId="cantidad"
                type="monotone"
                dataKey="cantidad"
                stroke="url(#lineGrad)"
                strokeWidth={3}
                dot={{
                  r: 5,
                  fill: "#FFFFFF",
                  stroke: "#8B5CF6",
                  strokeWidth: 2.5,
                }}
                activeDot={{
                  r: 7,
                  fill: "#8B5CF6",
                  stroke: "#FFFFFF",
                  strokeWidth: 2.5,
                }}
                isAnimationActive
              />
            </ComposedChart>
          ) : viewMode === "area" ? (
            <AreaChart
              key={`area-${animationKey}`}
              data={data}
              margin={{ top: 12, right: isMobile ? 8 : 16, left: isMobile ? -8 : 4, bottom: 4 }}
            >
              <defs>
                <linearGradient id="areaTotalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="areaPagadoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs font-semibold fill-slate-500 dark:fill-slate-400 capitalize"
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={isMobile ? 42 : 56}
                tickFormatter={formatChartAxisMoney}
                className="text-xs font-medium fill-slate-400 dark:fill-slate-500"
                domain={[0, Math.ceil(peak * 1.15)]}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as MonthlyTrendPoint;
                  if (!row) return null;
                  return (
                    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur-md min-w-[220px] text-xs">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100 capitalize mb-2">
                        {label}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-purple-600 font-medium">Monto Total:</span>
                          <span className="font-extrabold">{formatCOP(row.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-600 font-medium">Pagado:</span>
                          <span className="font-extrabold">{formatCOP(row.pagado)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500">Solicitudes:</span>
                          <span className="font-bold">{row.cantidad}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="total"
                name="Total Solicitado"
                stroke="#7C3AED"
                strokeWidth={3}
                fill="url(#areaTotalGrad)"
                isAnimationActive
              />
              <Area
                type="monotone"
                dataKey="pagado"
                name="Pagado"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#areaPagadoGrad)"
                isAnimationActive
              />
            </AreaChart>
          ) : (
            <BarChart
              key={`count-${animationKey}`}
              data={data}
              margin={{ top: 12, right: isMobile ? 8 : 16, left: isMobile ? -8 : 4, bottom: 4 }}
            >
              <defs>
                <linearGradient id="barCountGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.85} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="currentColor" className="text-slate-200/70 dark:text-slate-800" />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs font-semibold fill-slate-500 dark:fill-slate-400 capitalize"
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={isMobile ? 30 : 40}
                allowDecimals={false}
                className="text-xs font-medium fill-slate-400 dark:fill-slate-500"
                domain={[0, Math.ceil(peakCount * 1.2)]}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as MonthlyTrendPoint;
                  if (!row) return null;
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-100 capitalize">{label}</p>
                      <p className="text-purple-600 font-extrabold text-sm mt-1">{row.cantidad} solicitudes</p>
                      <p className="text-slate-400 text-[11px]">Monto: {formatCOP(row.total)}</p>
                    </div>
                  );
                }}
              />

              <Bar
                dataKey="cantidad"
                fill="url(#barCountGrad)"
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
                isAnimationActive
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* LEYENDA CLARA Y EXPLICATIVA */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
        {activeEstados.map((key) => {
          const conf = ESTADO_CONFIG[key];
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="size-3 rounded-md shadow-xs"
                style={{ backgroundColor: conf.color }}
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {conf.label}
              </span>
            </div>
          );
        })}

        <div className="flex items-center gap-2">
          <span className="h-1 w-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            Curva Solicitudes
          </span>
        </div>
      </div>
    </div>
  );
}

export function DashboardEmpresaChart({
  adelantos,
  empresas,
  empresaBars,
  animationKey = 0,
  className,
}: Pick<DashboardChartsProps, "adelantos" | "empresas" | "animationKey" | "className"> & {
  empresaBars?: EmpresaBarPoint[];
}) {
  const isMobile = useIsMobile();
  const data = useMemo(
    () => empresaBars ?? buildEmpresaBars(empresas, adelantos),
    [empresaBars, empresas, adelantos],
  );
  const chartHeight = Math.max(240, data.length * 54 + 52);

  return (
    <div className={cn("admin-panel-card h-full flex flex-col relative overflow-hidden", className)}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="admin-section-title text-lg font-bold text-slate-800 dark:text-slate-100">
            Adelantos por empresa
          </h2>
          <p className="admin-section-subtitle text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Comparativa de montos acumulados por organización.
          </p>
        </div>

        {data.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 text-xs font-bold border border-purple-200/60 dark:border-purple-800/40">
            {data.length} {data.length === 1 ? "empresa" : "empresas"}
          </span>
        )}
      </div>

      <div className="w-full flex-1 min-w-0" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={animationKey}
            data={data}
            layout="vertical"
            margin={{ top: 4, right: isMobile ? 12 : 24, left: 0, bottom: 4 }}
            barCategoryGap="24%"
          >
            <defs>
              {EMPRESA_BAR_COLORS.map((c, i) => (
                <linearGradient key={i} id={`empresaGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={c.start} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={c.end} stopOpacity={1} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid horizontal={false} strokeDasharray="3 4" stroke="currentColor" className="text-slate-200/60 dark:text-slate-800" />

            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatChartAxisMoney}
              className="text-xs font-medium fill-slate-400 dark:fill-slate-500"
            />

            <YAxis
              type="category"
              dataKey="nombreCorto"
              tickLine={false}
              axisLine={false}
              width={isMobile ? 80 : 115}
              className="text-xs sm:text-sm fill-slate-700 dark:fill-slate-200 font-semibold"
            />

            <Tooltip
              cursor={{ fill: "rgba(124, 58, 237, 0.04)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as EmpresaBarPoint;
                if (!row) return null;

                return (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{row.nombre}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      {row.cantidad} adelanto{row.cantidad === 1 ? "" : "s"}
                      {!row.activa ? " · Inactiva" : ""}
                    </p>
                    <p className="font-extrabold text-purple-600 dark:text-purple-400 text-sm mt-1.5 tabular-nums">
                      {formatCOP(row.total)}
                    </p>
                  </div>
                );
              }}
            />

            <Bar dataKey="total" radius={[0, 8, 8, 0]} maxBarSize={24} isAnimationActive>
              {data.map((entry, index) => (
                <Cell
                  key={entry.id}
                  fill={`url(#empresaGrad${index % EMPRESA_BAR_COLORS.length})`}
                  opacity={entry.activa ? 1 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
