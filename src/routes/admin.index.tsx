import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { estadoLabel, formatCOP } from "@/lib/admin-store";
import { useAdelantoParametros } from "@/hooks/use-adelanto-parametros";
import { useDashboardAdelantos } from "@/hooks/use-dashboard-adelantos";
import { useEmpleadosMetricas } from "@/hooks/use-empleados-metricas";
import { useSolicitudesAdmin } from "@/hooks/use-solicitudes-admin";
import { dashboardToMonthlyTrend, adelantosToEmpresaBars } from "@/lib/dashboard-api-data";
import { ESTADO_TEXT_CLASSES } from "@/lib/adelanto-estado";
import { getStoredUser } from "@/lib/auth-storage";
import { PageHeader } from "@/components/admin/page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { DashboardEmpresaChart, DashboardTrendChart } from "@/components/admin/dashboard-charts";
import { useDashboardAnimationKey } from "@/hooks/use-dashboard-animation-key";
import { useTimeBasedGreeting } from "@/hooks/use-time-based-greeting";
import { Wallet, CheckCircle2, TrendingUp, ArrowUpRight, Coins, Users, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Inicio — Panel" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { valorComision } = useAdelantoParametros();
  const { data: dashboardApi, loading: loadingDashboard } = useDashboardAdelantos();
  const { data: empleadosMetricas } = useEmpleadosMetricas();
  const { adelantos: solicitudesApi, loading: loadingSolicitudes } = useSolicitudesAdmin();
  const animationKey = useDashboardAnimationKey();
  const displayName = getStoredUser()?.full_name ?? "Administrador";
  const greeting = useTimeBasedGreeting(displayName);

  const trendData = useMemo(
    () => (dashboardApi ? dashboardToMonthlyTrend(dashboardApi) : undefined),
    [dashboardApi],
  );

  const empresaBars = useMemo(() => adelantosToEmpresaBars(solicitudesApi), [solicitudesApi]);

  const stats = useMemo(() => {
    const totalAdelantos = dashboardApi?.total_solicitudes ?? solicitudesApi.length;
    const montoAdelantado = dashboardApi
      ? Number(dashboardApi.monto_total_solicitado)
      : solicitudesApi.reduce((s, a) => s + a.monto, 0);
    const pagado = dashboardApi
      ? Number(dashboardApi.monto_total_aprobado)
      : solicitudesApi
          .filter((a) => a.estado === "pagado")
          .reduce((s, a) => s + a.monto, 0);
    const tarifa = Number(valorComision) || 0;
    const comisionEstimada = solicitudesApi
      .filter((a) => a.estado === "pagado")
      .reduce((s, a) => s + tarifa * a.numeroCuotas, 0);

    return {
      empleadosActivos: empleadosMetricas?.activos ?? 0,
      totalEmpleados: empleadosMetricas?.total_empleados ?? 0,
      totalAdelantos,
      montoAdelantado,
      pagado,
      comisionEstimada,
      tasaAprobacion: dashboardApi?.tasa_aprobacion_por_mes.at(-1)?.tasa,
    };
  }, [dashboardApi, solicitudesApi, empleadosMetricas, valorComision]);

  const recientes = useMemo(
    () =>
      [...solicitudesApi]
        .sort((a, b) => +new Date(b.fechaSolicitud) - +new Date(a.fechaSolicitud))
        .slice(0, 6),
    [solicitudesApi],
  );

  const loading = loadingDashboard || loadingSolicitudes;

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
          <p className="text-sm text-muted-foreground">
            Datos al{" "}
            {new Date().toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
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
          sub="acumulado histórico"
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
            <span className="flex items-center gap-1">
              <ArrowUpRight className="size-3.5 text-primary" />
              todas las solicitudes
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
              ? `Tasa aprobación mes: ${stats.tasaAprobacion.toFixed(0)}%`
              : "estimado por tarifa × cuotas"
          }
          icon={Coins}
        />
      </section>

      <DashboardTrendChart
        adelantos={solicitudesApi}
        trendData={trendData}
        animationKey={animationKey}
      />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <DashboardEmpresaChart
            adelantos={solicitudesApi}
            empresas={[]}
            empresaBars={empresaBars}
            animationKey={animationKey}
          />
        </div>

        <div className="admin-panel-card">
          <h2 className="admin-section-title text-lg mb-1">Solicitudes recientes</h2>
          <p className="admin-section-subtitle text-base mb-5">Últimas 6 del API.</p>
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
              <p className="text-sm text-muted-foreground py-6 text-center">Sin solicitudes registradas.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
