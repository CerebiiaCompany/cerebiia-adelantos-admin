import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAdmin, formatCOP } from "@/lib/admin-store";
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
    <div className="p-6 md:p-10 space-y-8 max-w-[1400px] mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resumen general</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Inicio</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Datos al {new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Empresas activas" value={String(stats.activas)} sub={`de ${empresas.length} registradas`} icon={Building2} />
        <KPI label="Adelantos totales" value={String(stats.totalAdelantos)} sub="acumulado histórico" icon={Wallet} />
        <KPI label="Monto adelantado" value={formatCOP(stats.totalMonto)} sub="todos los estados" icon={TrendingUp} accent />
        <KPI label="Pagado a empleados" value={formatCOP(stats.pagado)} sub="estado: pagado" icon={CheckCircle2} />
      </section>

      {/* Por empresa */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg">Adelantos por empresa</h2>
              <p className="text-sm text-muted-foreground">Distribución por monto acumulado.</p>
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

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-lg mb-1">Solicitudes recientes</h2>
          <p className="text-sm text-muted-foreground mb-4">Últimas 6 entradas.</p>
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

function KPI({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 relative overflow-hidden ${
        accent ? "border-primary/30 bg-primary/[0.04]" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`size-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="text-2xl md:text-3xl font-semibold tabular tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
        {accent && <ArrowUpRight className="size-3 text-primary" />}
        {sub}
      </div>
    </div>
  );
}
