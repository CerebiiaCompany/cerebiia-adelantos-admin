import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { estadoLabel } from "@/lib/admin-store";
import { useAdelantoParametros } from "@/hooks/use-adelanto-parametros";
import { useDashboardAdelantos } from "@/hooks/use-dashboard-adelantos";
import { useEmpleadosMetricas } from "@/hooks/use-empleados-metricas";
import { useSolicitudesRecientes } from "@/hooks/use-solicitudes-recientes";
import { empresasToBars, useEmpresasRanking } from "@/hooks/use-empresas-ranking";
import { dashboardToMonthlyTrend } from "@/lib/dashboard-api-data";
import {
  currentMonthKey,
  PERIODO_HISTORICO,
  periodoLabel,
  recentMonthKeys,
} from "@/lib/dashboard-periodo";
import { ESTADO_TEXT_CLASSES } from "@/lib/adelanto-estado";
import { getStoredUser } from "@/lib/auth-storage";
import { PageHeader } from "@/components/admin/page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { DashboardEmpresaChart, DashboardTrendChart } from "@/components/admin/dashboard-charts";
import { useDashboardAnimationKey } from "@/hooks/use-dashboard-animation-key";
import { useTimeBasedGreeting } from "@/hooks/use-time-based-greeting";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, CheckCircle2, TrendingUp, ArrowUpRight, Coins, Users, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Inicio — Panel" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [periodoKey, setPeriodoKey] = useState(currentMonthKey);
  const [periodoAnimTick, setPeriodoAnimTick] = useState(0);
  const monthOptions = useMemo(() => recentMonthKeys(12), []);
  const isHistorico = periodoKey === PERIODO_HISTORICO;

  useEffect(() => {
    setPeriodoAnimTick((t) => t + 1);
  }, [periodoKey]);

  const { valorComision } = useAdelantoParametros();
  const { data: dashboardApi, loading: loadingDashboard } = useDashboardAdelantos(periodoKey);
  const { data: empleadosMetricas } = useEmpleadosMetricas();
  const { adelantos: recientes, loading: loadingRecientes } = useSolicitudesRecientes(6, periodoKey);
  const { empresas, loading: loadingEmpresas } = useEmpresasRanking(periodoKey);
  const routeAnimationKey = useDashboardAnimationKey();
  const animationKey = routeAnimationKey + periodoAnimTick;
  const displayName = getStoredUser()?.full_name ?? "Administrador";
  const greeting = useTimeBasedGreeting(displayName);

  const trendData = useMemo(
    () => (dashboardApi ? dashboardToMonthlyTrend(dashboardApi) : undefined),
    [dashboardApi],
  );

  const empresaBars = useMemo(() => empresasToBars(empresas), [empresas]);

  const periodoSub = isHistorico ? "histórico (toda la vida)" : periodoLabel(periodoKey);

  const stats = useMemo(() => {
    const totalAdelantos = dashboardApi?.total_solicitudes ?? 0;
    const montoAdelantado = dashboardApi ? Number(dashboardApi.monto_total_solicitado) : 0;
    const pagado = dashboardApi ? Number(dashboardApi.monto_total_aprobado) : 0;
    const tarifa = Number(valorComision) || 0;
    const cuotasPromedio = dashboardApi?.cuotas_mas_frecuente ?? 1;
    const pagadasApprox = dashboardApi?.conteo_por_estado?.pagado ?? 0;
    const comisionEstimada = tarifa * cuotasPromedio * pagadasApprox;

    return {
      empleadosActivos: empleadosMetricas?.activos ?? 0,
      totalEmpleados: empleadosMetricas?.total_empleados ?? 0,
      totalAdelantos,
      montoAdelantado,
      pagado,
      comisionEstimada,
      tasaAprobacion: dashboardApi?.tasa_aprobacion_por_mes.at(-1)?.tasa,
    };
  }, [dashboardApi, empleadosMetricas, valorComision]);

  const loading = loadingDashboard || loadingRecientes || loadingEmpresas;

  return (
    <div className="admin-page animate-fade-in">
      <PageHeader
        icon={greeting.icon}
        title={greeting.title}
        description={greeting.description}
        iconContainerClassName={greeting.iconContainerClassName}
        iconClassName={greeting.iconClassName}
        iconAnimationClassName={greeting.iconAnimationClassName}
        className="lg:items-center"
        actions={
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Periodo</Label>
              <Select value={periodoKey} onValueChange={setPeriodoKey}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PERIODO_HISTORICO}>Histórico (toda la vida)</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">
                      {periodoLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      {loading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
          <Loader2 className="size-4 animate-spin" />
          Cargando métricas del servidor…
        </p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        <AdminMetricCard
          label="Empleados activos"
          iconTone="building"
          value={
            <AnimatedNumber value={stats.empleadosActivos} animationKey={animationKey} delay={0} />
          }
          sub={
            <>
              de{" "}
              <AnimatedNumber value={stats.totalEmpleados} animationKey={animationKey} delay={60} />{" "}
              registrados
            </>
          }
          icon={Users}
        />
        <AdminMetricCard
          label="Adelantos totales"
          iconTone="wallet"
          value={
            <AnimatedNumber value={stats.totalAdelantos} animationKey={animationKey} delay={80} />
          }
          sub={<span className="capitalize">{periodoSub}</span>}
          icon={Wallet}
        />
        <AdminMetricCard
          label="Monto adelantado"
          iconTone="trending"
          value={
            <AnimatedNumber
              value={stats.montoAdelantado}
              format="currency"
              animationKey={animationKey}
              delay={160}
            />
          }
          sub={
            <span className="flex items-center gap-1 capitalize">
              <ArrowUpRight className="size-3.5 text-primary shrink-0" />
              {periodoSub}
            </span>
          }
          icon={TrendingUp}
          accent
        />
        <AdminMetricCard
          label="Pagado a empleados"
          iconTone="success"
          value={
            <AnimatedNumber
              value={stats.pagado}
              format="currency"
              animationKey={animationKey}
              delay={240}
            />
          }
          sub="desembolsos confirmados"
          icon={CheckCircle2}
        />
        <AdminMetricCard
          label="Comisión (pagados)"
          iconTone="trending"
          value={
            <AnimatedNumber
              value={stats.comisionEstimada}
              format="currency"
              animationKey={animationKey}
              delay={320}
            />
          }
          sub={
            stats.tasaAprobacion != null
              ? `Tasa aprobación: ${stats.tasaAprobacion.toFixed(0)}%`
              : "estimado por tarifa × cuotas"
          }
          icon={Coins}
        />
      </section>

      <DashboardTrendChart adelantos={[]} trendData={trendData} animationKey={animationKey} />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <DashboardEmpresaChart
            adelantos={[]}
            empresas={[]}
            empresaBars={empresaBars}
            animationKey={animationKey}
          />
        </div>

        <div className="admin-panel-card">
          <h2 className="admin-section-title text-lg mb-1">Solicitudes recientes</h2>
          <p className="admin-section-subtitle text-base mb-5 capitalize">
            Últimas 6 · {periodoSub}
          </p>
          <div className="divide-y divide-border">
            {recientes.map((a, index) => (
              <div key={a.id} className="py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
                <div className="size-9 sm:size-10 rounded-lg bg-muted grid place-items-center text-xs sm:text-sm font-semibold shrink-0">
                  {a.empleadoNombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold truncate">{a.empleadoNombre}</div>
                  <div className="text-sm text-muted-foreground truncate mt-0.5">
                    {a.empresaNombre ?? "—"}
                  </div>
                </div>
                <div className="text-right shrink-0 max-w-[45%] sm:max-w-none">
                  <div className="admin-panel-amount">
                    <AnimatedNumber
                      value={a.monto}
                      format="currency"
                      animationKey={animationKey}
                      delay={280 + index * 50}
                    />
                  </div>
                  <div
                    className={`text-xs uppercase tracking-wider font-semibold mt-1 ${ESTADO_TEXT_CLASSES[a.estado]}`}
                  >
                    {estadoLabel[a.estado]}
                  </div>
                </div>
              </div>
            ))}
            {recientes.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sin solicitudes en este periodo.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
