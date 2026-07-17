import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyTrendPoint, EmpresaBarPoint } from "@/lib/dashboard-chart-data";
import type { Adelanto, Empresa } from "@/lib/admin-store";
import { formatCOP } from "@/lib/admin-store";
import {
  buildEmpresaBars,
  buildMonthlyTrend,
  formatChartAxisMoney,
} from "@/lib/dashboard-chart-data";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const trendConfig = {
  total: {
    label: "Monto total",
    color: "hsl(var(--chart-1))",
  },
  cantidad: {
    label: "Solicitudes",
    color: "hsl(var(--chart-3))",
  },
  pagado: {
    label: "Pagado",
    color: "hsl(var(--chart-5))",
  },
  aprobado: {
    label: "Aprobado",
    color: "hsl(var(--chart-4))",
  },
  en_revision: {
    label: "En revisión",
    color: "hsl(var(--chart-2))",
  },
  solicitado: {
    label: "Solicitado",
    color: "hsl(var(--chart-1))",
  },
  rechazado: {
    label: "Rechazado",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig;

const empresaConfig = {
  total: {
    label: "Monto acumulado",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const EMPRESA_BAR_COLORS = [
  "hsl(262 80% 50%)",
  "hsl(270 70% 58%)",
  "hsl(280 65% 55%)",
  "hsl(248 72% 62%)",
  "hsl(300 55% 58%)",
  "hsl(235 65% 58%)",
];

type DashboardChartsProps = {
  adelantos: Adelanto[];
  empresas: Empresa[];
  animationKey?: number;
  className?: string;
};

const ESTADO_KEYS = [
  "pagado",
  "aprobado",
  "en_revision",
  "solicitado",
  "rechazado",
] as const;

type EstadoKey = (typeof ESTADO_KEYS)[number];

const ESTADO_BAR_STYLE: Record<
  EstadoKey,
  { fill: string; radius?: [number, number, number, number] }
> = {
  pagado: { fill: "hsl(var(--chart-5))" },
  aprobado: { fill: "hsl(var(--chart-4))" },
  en_revision: { fill: "hsl(var(--chart-2))" },
  solicitado: { fill: "hsl(var(--chart-1))" },
  rechazado: {
    fill: "hsl(var(--muted-foreground) / 0.45)",
    radius: [6, 6, 0, 0],
  },
};

export function DashboardTrendChart({
  adelantos,
  trendData,
  animationKey = 0,
  className,
}: Pick<DashboardChartsProps, "adelantos" | "animationKey" | "className"> & {
  trendData?: MonthlyTrendPoint[];
}) {
  const isMobile = useIsMobile();
  const data = useMemo(
    () => trendData ?? buildMonthlyTrend(adelantos),
    [trendData, adelantos],
  );
  const peak = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data]);

  const activeEstados = useMemo(() => {
    return ESTADO_KEYS.filter((key) => data.some((d) => Number(d[key]) > 0));
  }, [data]);

  const chartConfig = useMemo(() => {
    const next: ChartConfig = {
      cantidad: trendConfig.cantidad,
    };
    for (const key of activeEstados) {
      next[key] = trendConfig[key];
    }
    return next;
  }, [activeEstados]);

  return (
    <div className={cn("admin-panel-card", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="admin-section-title text-lg">Evolución de adelantos</h2>
          <p className="admin-section-subtitle text-base mt-1">
            Monto por estado y cantidad de solicitudes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          {data.slice(-1).map((point) => (
            <span
              key={point.key}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-xs sm:text-sm font-medium text-foreground truncate"
            >
              <span className="size-2 rounded-full bg-primary" />
              {point.label}: {formatCOP(point.total)}
            </span>
          ))}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[240px] sm:h-[280px] lg:h-[300px] w-full aspect-auto">
        <ComposedChart
          key={animationKey}
          data={data}
          margin={{ top: 8, right: isMobile ? 0 : 8, left: isMobile ? -8 : 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="4 6" className="stroke-border/60" />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-sm fill-muted-foreground"
          />

          <YAxis
            yAxisId="monto"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={isMobile ? 40 : 52}
            tickFormatter={formatChartAxisMoney}
            className="text-xs fill-muted-foreground"
            domain={[0, Math.ceil(peak * 1.12)]}
          />

          <YAxis
            yAxisId="cantidad"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={isMobile ? 28 : 36}
            allowDecimals={false}
            className="text-xs fill-muted-foreground"
          />

          <ChartTooltip
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 4" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const filtered = payload.filter((item) => {
                if (item.dataKey === "cantidad") return true;
                return Number(item.value) > 0;
              });
              if (!filtered.length) return null;
              return (
                <ChartTooltipContent
                  active={active}
                  payload={filtered}
                  label={label}
                  labelFormatter={(_, tipPayload) => {
                    const row = tipPayload?.[0]?.payload as
                      | { label: string; cantidad: number }
                      | undefined;
                    if (!row) return null;
                    return (
                      <span className="font-display font-semibold capitalize">
                        {row.label} · {row.cantidad} solicitud{row.cantidad === 1 ? "" : "es"}
                      </span>
                    );
                  }}
                  formatter={(value, name) => {
                    if (name === "cantidad") return [value, "Solicitudes"];
                    return [
                      formatCOP(Number(value)),
                      trendConfig[name as keyof typeof trendConfig]?.label ?? name,
                    ];
                  }}
                />
              );
            }}
          />

          <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-3 gap-y-2 justify-start sm:justify-center" />} />

          {activeEstados.map((key, index) => {
            const style = ESTADO_BAR_STYLE[key];
            const isTop = index === activeEstados.length - 1;
            return (
              <Bar
                key={key}
                yAxisId="monto"
                dataKey={key}
                stackId="estado"
                fill={style.fill}
                radius={isTop ? (style.radius ?? [6, 6, 0, 0]) : undefined}
                maxBarSize={32}
                isAnimationActive
              />
            );
          })}

          <Line
            yAxisId="cantidad"
            type="monotone"
            dataKey="cantidad"
            stroke="hsl(38 92% 42%)"
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: "hsl(var(--background))",
              stroke: "hsl(38 92% 42%)",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: "hsl(38 92% 42%)",
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
            isAnimationActive
          />
        </ComposedChart>
      </ChartContainer>
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
  const chartHeight = Math.max(220, data.length * 52 + 48);

  return (
    <div className={cn("admin-panel-card h-full flex flex-col", className)}>
      <div className="mb-5">
        <h2 className="admin-section-title text-lg">Adelantos por empresa</h2>
        <p className="admin-section-subtitle text-base mt-1">
          Comparación por monto acumulado.
        </p>
      </div>

      <ChartContainer
        config={empresaConfig}
        className="w-full aspect-auto flex-1 min-w-0"
        style={{ height: chartHeight }}
      >
        <BarChart
          key={animationKey}
          data={data}
          layout="vertical"
          margin={{ top: 4, right: isMobile ? 8 : 16, left: 0, bottom: 4 }}
          barCategoryGap="22%"
        >
          <defs>
            {EMPRESA_BAR_COLORS.map((color, i) => (
              <linearGradient key={color} id={`empresaBarGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                <stop offset="100%" stopColor={color} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid horizontal={false} strokeDasharray="4 6" className="stroke-border/50" />

          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={formatChartAxisMoney}
            className="text-xs fill-muted-foreground"
          />

          <YAxis
            type="category"
            dataKey="nombreCorto"
            tickLine={false}
            axisLine={false}
            width={isMobile ? 72 : 108}
            className="text-xs sm:text-sm fill-foreground font-medium"
          />

          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, _name, item) => {
                  const row = item.payload as EmpresaBarPoint;
                  return [
                    <div key="empresa-tip" className="space-y-0.5 text-left">
                      <p className="font-display font-semibold text-foreground">{row.nombre}</p>
                      <p className="text-muted-foreground">
                        {row.cantidad} adelanto{row.cantidad === 1 ? "" : "s"}
                        {!row.activa ? " · Inactiva" : ""}
                      </p>
                      <p className="font-display font-bold tabular-nums">{formatCOP(Number(value))}</p>
                    </div>,
                    "",
                  ];
                }}
              />
            }
          />

          <Bar dataKey="total" radius={[0, 8, 8, 0]} maxBarSize={22} isAnimationActive>
            {data.map((entry, index) => (
              <Cell
                key={entry.id}
                fill={`url(#empresaBarGrad${index % EMPRESA_BAR_COLORS.length})`}
                opacity={entry.activa ? 1 : 0.55}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
