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
import type { EmpresaBarPoint } from "@/lib/dashboard-chart-data";
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

export function DashboardTrendChart({
  adelantos,
  animationKey = 0,
  className,
}: Pick<DashboardChartsProps, "adelantos" | "animationKey" | "className">) {
  const isMobile = useIsMobile();
  const data = useMemo(() => buildMonthlyTrend(adelantos), [adelantos]);
  const peak = useMemo(() => Math.max(...data.map((d) => d.total), 1), [data]);

  return (
    <div className={cn("admin-panel-card", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="admin-section-title text-lg">Evolución de adelantos</h2>
          <p className="admin-section-subtitle text-base mt-1">
            Monto y solicitudes de los últimos 6 meses.
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

      <ChartContainer config={trendConfig} className="h-[240px] sm:h-[280px] lg:h-[300px] w-full aspect-auto">
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
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { label: string; cantidad: number } | undefined;
                  if (!row) return null;
                  return (
                    <span className="font-display font-semibold capitalize">
                      {row.label} · {row.cantidad} solicitud{row.cantidad === 1 ? "" : "es"}
                    </span>
                  );
                }}
                formatter={(value, name) => {
                  if (name === "cantidad") return [value, "Solicitudes"];
                  return [formatCOP(Number(value)), trendConfig[name as keyof typeof trendConfig]?.label ?? name];
                }}
              />
            }
          />

          <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-3 gap-y-2 justify-start sm:justify-center" />} />

          <Bar
            yAxisId="monto"
            dataKey="pagado"
            stackId="estado"
            fill="hsl(var(--chart-5))"
            maxBarSize={32}
            isAnimationActive
          />
          <Bar
            yAxisId="monto"
            dataKey="aprobado"
            stackId="estado"
            fill="hsl(var(--chart-4))"
            maxBarSize={32}
            isAnimationActive
          />
          <Bar
            yAxisId="monto"
            dataKey="en_revision"
            stackId="estado"
            fill="hsl(var(--chart-2))"
            maxBarSize={32}
            isAnimationActive
          />
          <Bar
            yAxisId="monto"
            dataKey="solicitado"
            stackId="estado"
            fill="hsl(var(--chart-1))"
            maxBarSize={32}
            isAnimationActive
          />
          <Bar
            yAxisId="monto"
            dataKey="rechazado"
            stackId="estado"
            fill="hsl(var(--muted-foreground) / 0.45)"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            isAnimationActive
          />

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
  animationKey = 0,
  className,
}: Pick<DashboardChartsProps, "adelantos" | "empresas" | "animationKey" | "className">) {
  const isMobile = useIsMobile();
  const data = useMemo(() => buildEmpresaBars(empresas, adelantos), [empresas, adelantos]);
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
