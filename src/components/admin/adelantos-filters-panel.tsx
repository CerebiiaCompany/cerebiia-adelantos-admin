import { formatCOP, estadoLabel, type EstadoAdelanto } from "@/lib/admin-store";
import { monthLabel } from "@/lib/adelantos-filters";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Eraser, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Empresa } from "@/lib/admin-store";

type AdelantosFiltersPanelProps = {
  empresaId: string;
  setEmpresaId: (v: string) => void;
  estado: string;
  setEstado: (v: string) => void;
  empresas: Empresa[];
  filteredCount: number;
  months?: string[];
  mes?: string;
  setMes?: (v: string) => void;
  showMes?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  setFechaDesde?: (v: string) => void;
  setFechaHasta?: (v: string) => void;
  showFechaRango?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onExportExcel?: () => void;
  exporting?: boolean;
};

export function AdelantosFiltersPanel({
  months = [],
  mes = "all",
  setMes,
  fechaDesde = "",
  fechaHasta = "",
  setFechaDesde,
  setFechaHasta,
  empresaId,
  setEmpresaId,
  estado,
  setEstado,
  empresas,
  filteredCount,
  showMes = true,
  showFechaRango = false,
  hasActiveFilters = false,
  onClearFilters,
  onExportExcel,
  exporting = false,
}: AdelantosFiltersPanelProps) {
  return (
    <div className="admin-panel-card space-y-4 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end gap-3">
      {showFechaRango && setFechaDesde && setFechaHasta && (
        <>
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs" htmlFor="fecha-desde">
              Desde
            </Label>
            <Input
              id="fecha-desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
          <div className="space-y-1.5 w-full sm:w-auto">
            <Label className="text-xs" htmlFor="fecha-hasta">
              Hasta
            </Label>
            <Input
              id="fecha-hasta"
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full sm:w-[160px]"
            />
          </div>
        </>
      )}
      {showMes && setMes && (
        <div className="space-y-1.5 w-full sm:w-auto">
          <Label className="text-xs">Mes</Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m} className="capitalize">
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5 w-full sm:w-auto">
        <Label className="text-xs">Empresa</Label>
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 w-full sm:w-auto">
        <Label className="text-xs">Estado</Label>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(Object.keys(estadoLabel) as EstadoAdelanto[]).map((e) => (
              <SelectItem key={e} value={e}>
                {estadoLabel[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
        <div className="text-left sm:text-right">
          <div className="admin-kpi-label">Mostrando</div>
          <div className="admin-kpi-value text-lg sm:text-xl mt-1">{filteredCount}</div>
          <div className="admin-kpi-sub mt-0.5">solicitudes filtradas</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {onClearFilters && (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={!hasActiveFilters}
              onClick={onClearFilters}
            >
              <Eraser className="size-4 mr-2" />
              Limpiar filtros
            </Button>
          )}
          {onExportExcel && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={exporting || filteredCount === 0}
              onClick={onExportExcel}
            >
              {exporting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Exportando…
                </>
              ) : (
                <>
                  <FileSpreadsheet className="size-4 mr-2" />
                  Exportar Excel
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdelantosStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return <AdminMetricCard label={label} value={value} accent={highlight} />;
}

export function AdelantosPorEmpresa({
  items,
  subtitle = "Suma de adelantos en el filtro actual.",
  modoCobro = false,
}: {
  items: {
    empresa?: Empresa;
    count: number;
    total: number;
    aprobado: number;
    verificada?: boolean;
  }[];
  subtitle?: string;
  modoCobro?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="admin-panel-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="admin-section-title">Total a cobrar por empresa</h2>
          <p className="admin-section-subtitle text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(({ empresa, count, total, aprobado, verificada }) => (
          <div
            key={empresa?.id}
            className={cn(
              "admin-nested-card min-w-0",
              verificada && modoCobro && "border-success/30 bg-success/[0.04]",
            )}
          >
            <div className="font-medium truncate">{empresa?.nombre ?? "—"}</div>
            <div className="text-xs text-muted-foreground mb-3">{count} adelantos</div>
            <div
              className={cn(
                "admin-kpi-value text-xl sm:text-2xl break-words tabular",
                verificada && modoCobro && "text-muted-foreground",
              )}
            >
              {formatCOP(total)}
            </div>
            {modoCobro && verificada && (
              <div className="text-xs text-success font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Cobro confirmado
              </div>
            )}
            {!verificada && aprobado > 0 && (
              <div className="text-xs text-primary mt-1 tabular">{formatCOP(aprobado)} por verificar</div>
            )}
            {!modoCobro && aprobado > 0 && (
              <div className="text-xs text-primary mt-1 tabular">{formatCOP(aprobado)} aprobado</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
