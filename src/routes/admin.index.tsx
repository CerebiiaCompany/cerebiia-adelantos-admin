import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAdmin, estadoLabel, sumarMontoAdelantado, sumarMontoPagado } from "@/lib/admin-store";
import { gananciaComisionPorMes } from "@/lib/dashboard-comision";
import { useAdelantoParametros } from "@/hooks/use-adelanto-parametros";
import { ESTADO_TEXT_CLASSES } from "@/lib/adelanto-estado";
import { getStoredUser } from "@/lib/auth-storage";
import { PageHeader } from "@/components/admin/page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { DashboardEmpresaChart, DashboardTrendChart } from "@/components/admin/dashboard-charts";
import { useDashboardAnimationKey } from "@/hooks/use-dashboard-animation-key";
import { useTimeBasedGreeting } from "@/hooks/use-time-based-greeting";
import { Building2, Wallet, CheckCircle2, TrendingUp, ArrowUpRight, Coins } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Inicio — Panel" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { empresas, adelantos } = useAdmin();
  const { valorComision } = useAdelantoParametros();
  const animationKey = useDashboardAnimationKey();
  const displayName = getStoredUser()?.full_name ?? "Administrador";
  const greeting = useTimeBasedGreeting(displayName);

  const stats = useMemo(() => {
    const activas = empresas.filter((e) => e.activa).length;
    const totalAdelantos = adelantos.length;
    const montoAdelantado = sumarMontoAdelantado(adelantos);
    const pagado = sumarMontoPagado(adelantos);
    const comisionMes = gananciaComisionPorMes(adelantos, valorComision);
    return { activas, totalAdelantos, montoAdelantado, pagado, comisionMes };
  }, [empresas, adelantos, valorComision]);

  const recientes = useMemo(
    () =>
      [...adelantos]
        .sort((a, b) => +new Date(b.fechaSolicitud) - +new Date(a.fechaSolicitud))
        .slice(0, 6),
    [adelantos],
  );

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

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        <AdminMetricCard
          label="Empresas activas"
          iconTone="building"
          value={
            <AnimatedNumber value={stats.activas} animationKey={animationKey} delay={0} />
          }
          sub={
            <>
              de <AnimatedNumber value={empresas.length} animationKey={animationKey} delay={60} /> registradas
            </>
          }
          icon={Building2}
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
          sub="con comprobante confirmado"
          icon={CheckCircle2}
        />
        <AdminMetricCard
          label="Ganancia por comisión"
          iconTone="trending"
          value={
            <AnimatedNumber
              value={stats.comisionMes.total}
              format="currency"
              animationKey={animationKey}
              delay={320}
            />
          }
          sub={
            stats.comisionMes.cantidad > 0
              ? `${stats.comisionMes.cantidad} pago(s) · ${stats.comisionMes.mesLabel}`
              : `Sin pagos en ${stats.comisionMes.mesLabel}`
          }
          icon={Coins}
        />
      </section>

      <DashboardTrendChart adelantos={adelantos} animationKey={animationKey} />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <DashboardEmpresaChart
            adelantos={adelantos}
            empresas={empresas}
            animationKey={animationKey}
          />
        </div>

        <div className="admin-panel-card">
          <h2 className="admin-section-title text-lg mb-1">Solicitudes recientes</h2>
          <p className="admin-section-subtitle text-base mb-5">Últimas 6 entradas.</p>
          <div className="divide-y divide-border">
            {recientes.map((a, index) => {
              const e = empresas.find((x) => x.id === a.empresaId);
              return (
                <div key={a.id} className="py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
                  <div className="size-9 sm:size-10 rounded-lg bg-muted grid place-items-center text-xs sm:text-sm font-semibold shrink-0">
                    {a.empleadoNombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold truncate">{a.empleadoNombre}</div>
                    <div className="text-sm text-muted-foreground truncate mt-0.5">{e?.nombre}</div>
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
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
