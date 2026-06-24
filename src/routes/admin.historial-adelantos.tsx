import { createFileRoute } from "@tanstack/react-router";
import { useAdmin, formatCOP } from "@/lib/admin-store";
import { useAdelantosFilters } from "@/lib/adelantos-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdelantosFiltersPanel,
  AdelantosPorEmpresa,
  AdelantosStat,
} from "@/components/admin/adelantos-filters-panel";

export const Route = createFileRoute("/admin/historial-adelantos")({
  head: () => ({ meta: [{ title: "Historial de adelantos — Panel" }] }),
  component: HistorialAdelantosPage,
});

function HistorialAdelantosPage() {
  const { empresas, adelantos } = useAdmin();
  const {
    months,
    mes,
    setMes,
    empresaId,
    setEmpresaId,
    estado,
    setEstado,
    filtered,
    totals,
    porEmpresa,
  } = useAdelantosFilters(adelantos, empresas);

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Operaciones"
        title="Historial de adelantos"
        subtitle="Filtra por mes y empresa, consulta totales y montos a cobrar por empresa."
      />

      <AdelantosFiltersPanel
        months={months}
        mes={mes}
        setMes={setMes}
        empresaId={empresaId}
        setEmpresaId={setEmpresaId}
        estado={estado}
        setEstado={setEstado}
        empresas={empresas}
        filteredCount={filtered.length}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdelantosStat label="Total filtrado" value={formatCOP(totals.total)} />
        <AdelantosStat label="Aprobado (por pagar)" value={formatCOP(totals.totalAprobado)} highlight />
        <AdelantosStat label="Aprobaciones pendientes" value={String(totals.countAprobado)} />
        <AdelantosStat label="Ya pagado" value={formatCOP(totals.totalPagado)} />
      </div>

      <AdelantosPorEmpresa items={porEmpresa} />
    </div>
  );
}
