import { formatCOP, estadoLabel, type EstadoAdelanto } from "@/lib/admin-store";
import { monthLabel } from "@/lib/adelantos-filters";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
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
};

export function AdelantosFiltersPanel({
  months = [],
  mes = "all",
  setMes,
  empresaId,
  setEmpresaId,
  estado,
  setEstado,
  empresas,
  filteredCount,
  showMes = true,
}: AdelantosFiltersPanelProps) {
  return (
    <div className="admin-panel-card flex flex-wrap items-end gap-3 p-4">
      {showMes && setMes && (
        <div className="space-y-1.5">
          <Label className="text-xs">Mes</Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-[200px]">
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
      <div className="space-y-1.5">
        <Label className="text-xs">Empresa</Label>
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="w-[220px]">
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
      <div className="space-y-1.5">
        <Label className="text-xs">Estado</Label>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-[180px]">
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
      <div className="ml-auto text-right">
        <div className="admin-kpi-label">Mostrando</div>
        <div className="admin-kpi-value text-xl mt-1">{filteredCount}</div>
        <div className="admin-kpi-sub mt-0.5">solicitudes</div>
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
}: {
  items: {
    empresa?: Empresa;
    count: number;
    total: number;
    aprobado: number;
  }[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="admin-panel-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="admin-section-title">Total a cobrar por empresa</h2>
          <p className="admin-section-subtitle text-xs">Suma de adelantos en el filtro actual.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(({ empresa, count, total, aprobado }) => (
          <div key={empresa?.id} className="admin-nested-card">
            <div className="font-medium">{empresa?.nombre ?? "—"}</div>
            <div className="text-xs text-muted-foreground mb-3">{count} adelantos</div>
            <div className="admin-kpi-value text-2xl">{formatCOP(total)}</div>
            {aprobado > 0 && (
              <div className="text-xs text-primary mt-1 tabular">{formatCOP(aprobado)} aprobado</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
