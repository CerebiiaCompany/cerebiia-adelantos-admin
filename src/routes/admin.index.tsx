import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAdmin, formatCOP } from "@/lib/admin-store";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { Building2, Wallet, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Inicio — Panel" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { empresas, adelantos } = useAdmin();

  const stats = useMemo(() => {
    const activas = empresas.filter((e) => e.activa).length;
    const totalAdelantos = adelantos.length;
    const totalMonto = adelantos.reduce((s, a) => s + a.monto, 0);
    const pagado = adelantos.filter((a) => a.estado === "pagado").reduce((s, a) => s + a.monto, 0);
    return { activas, totalAdelantos, totalMonto, pagado };
  }, [empresas, adelantos]);

  const porEmpresa = useMemo(() => {
    return empresas
      .map((e) => {
        const list = adelantos.filter((a) => a.empresaId === e.id);
        const total = list.reduce((s, a) => s + a.monto, 0);
        return { empresa: e, cantidad: list.length, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [empresas, adelantos]);

  const maxTotal = Math.max(1, ...porEmpresa.map((x) => x.total));

  const recientes = useMemo(
    () =>
      [...adelantos]
        .sort((a, b) => +new Date(b.fechaSolicitud) - +new Date(a.fechaSolicitud))
        .slice(0, 6),
    [adelantos],
  );

  return (
    <div className="admin-page space-y-8">
      <AdminPageHeader
        eyebrow="Resumen general"
        title="Inicio"
        aside={
          <p className="admin-subtitle mt-0">
            Datos al {new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          label="Empresas activas"
          value={String(stats.activas)}
          sub={`de ${empresas.length} registradas`}
          icon={Building2}
        />
        <AdminMetricCard
          label="Adelantos totales"
          value={String(stats.totalAdelantos)}
          sub="acumulado histórico"
          icon={Wallet}
        />
        <AdminMetricCard
          label="Monto adelantado"
          value={formatCOP(stats.totalMonto)}
          sub={
            <span className="flex items-center gap-1">
              <ArrowUpRight className="size-3 text-primary" />
              todos los estados
            </span>
          }
          icon={TrendingUp}
          accent
        />
        <AdminMetricCard
          label="Pagado a empleados"
          value={formatCOP(stats.pagado)}
          sub="estado: pagado"
          icon={CheckCircle2}
        />
      </section>

      {/* Por empresa */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 admin-panel-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="admin-section-title">Adelantos por empresa</h2>
              <p className="admin-section-subtitle">Distribución por monto acumulado.</p>
            </div>
          </div>
          <div className="space-y-4">
            {porEmpresa.map(({ empresa, cantidad, total }) => (
              <div key={empresa.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{empresa.nombre}</span>
                    {!empresa.activa && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 text-sm">
                    <span className="text-muted-foreground tabular">{cantidad} adel.</span>
                    <span className="font-semibold tabular">{formatCOP(total)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(total / maxTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel-card">
          <h2 className="admin-section-title mb-1">Solicitudes recientes</h2>
          <p className="admin-section-subtitle mb-4">Últimas 6 entradas.</p>
          <div className="divide-y divide-border">
            {recientes.map((a) => {
              const e = empresas.find((x) => x.id === a.empresaId);
              return (
                <div key={a.id} className="py-3 flex items-center gap-3">
                  <div className="size-8 rounded-md bg-muted grid place-items-center text-xs font-medium">
                    {a.empleadoNombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{a.empleadoNombre}</div>
                    <div className="text-xs text-muted-foreground truncate">{e?.nombre}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular">{formatCOP(a.monto)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{a.estado.replace("_", " ")}</div>
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
