import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdmin, formatCOP } from "@/lib/admin-store";
import { useAdelantosFilters } from "@/lib/adelantos-filters";
import { exportAdelantosExcel } from "@/lib/export-adelantos-excel";
import { useAdelantoParametros } from "@/hooks/use-adelanto-parametros";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdelantosFiltersPanel,
  AdelantosStat,
} from "@/components/admin/adelantos-filters-panel";

export const Route = createFileRoute("/admin/historial-adelantos")({
  head: () => ({ meta: [{ title: "Historial de adelantos — Panel" }] }),
  component: HistorialAdelantosPage,
});

function HistorialAdelantosPage() {
  const { empresas, adelantos } = useAdmin();
  const { calcular } = useAdelantoParametros();
  const [exporting, setExporting] = useState(false);
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
    clearFilters,
    hasActiveFilters,
  } = useAdelantosFilters(adelantos, empresas);

  const handleExportExcel = () => {
    if (!filtered.length) return;
    setExporting(true);
    try {
      exportAdelantosExcel(filtered, empresas, calcular, "historial-adelantos");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Operaciones"
        title="Historial de adelantos"
        subtitle="Filtra por mes y empresa, consulta totales y estados de las solicitudes."
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
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onExportExcel={handleExportExcel}
        exporting={exporting}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdelantosStat label="Total filtrado" value={formatCOP(totals.total)} />
        <AdelantosStat label="Aprobado (por pagar)" value={formatCOP(totals.totalAprobado)} highlight />
        <AdelantosStat label="Aprobaciones pendientes" value={String(totals.countAprobado)} />
        <AdelantosStat label="Ya pagado" value={formatCOP(totals.totalPagado)} />
      </div>
    </div>
  );
}
