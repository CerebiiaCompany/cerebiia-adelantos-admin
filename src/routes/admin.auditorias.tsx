import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { estadoLabel, type EstadoAdelanto } from "@/lib/admin-store";
import { getAuditoriaIndicadores, listAuditoria } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
import type { AuditoriaAdminItem, AuditoriaIndicadoresApi } from "@/lib/api/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Eye,
  CheckCircle2,
  XCircle,
  Banknote,
  ShieldCheck,
  ChevronDown,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/auditorias")({
  head: () => ({ meta: [{ title: "Auditorías — Panel" }] }),
  component: AuditoriasPage,
});

const ACCION_LABEL: Record<string, string> = {
  aprobar: "Aprobó solicitud",
  aprobado: "Aprobó solicitud",
  aprobacion: "Aprobó solicitud",
  rechazar: "Rechazó solicitud",
  rechazado: "Rechazó solicitud",
  rechazo: "Rechazó solicitud",
  revisar: "Pasó a revisión",
  en_revision: "Pasó a revisión",
  paso_revision: "Pasó a revisión",
  pagar: "Confirmó pago",
  pagado: "Confirmó pago",
  pago_confirmado: "Confirmó pago",
};

const ACCION_BADGE: Record<string, string> = {
  aprobar: "bg-primary/15 text-primary border-primary/30",
  aprobado: "bg-primary/15 text-primary border-primary/30",
  aprobacion: "bg-primary/15 text-primary border-primary/30",
  rechazar: "bg-destructive/15 text-destructive border-destructive/30",
  rechazado: "bg-destructive/15 text-destructive border-destructive/30",
  rechazo: "bg-destructive/15 text-destructive border-destructive/30",
  revisar: "bg-warning/15 text-warning border-warning/30",
  en_revision: "bg-warning/15 text-warning border-warning/30",
  paso_revision: "bg-warning/15 text-warning border-warning/30",
  pagar: "bg-success/15 text-success border-success/30",
  pagado: "bg-success/15 text-success border-success/30",
  pago_confirmado: "bg-success/15 text-success border-success/30",
};

function accionLabel(accion: string) {
  return ACCION_LABEL[accion] ?? accion.replace(/_/g, " ");
}

function AccionBadge({ accion }: { accion: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        ACCION_BADGE[accion] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {accionLabel(accion)}
    </span>
  );
}

function estadoUi(estado: string): string {
  return estadoLabel[estado as EstadoAdelanto] ?? estado.replace(/_/g, " ");
}

function toIsoDayStart(date: string) {
  return date ? `${date}T00:00:00` : undefined;
}

function toIsoDayEnd(date: string) {
  return date ? `${date}T23:59:59` : undefined;
}

function AuditoriasPage() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AuditoriaAdminItem[]>([]);
  const [count, setCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [indicadores, setIndicadores] = useState<AuditoriaIndicadoresApi | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const dateParams = {
      fecha_desde: toIsoDayStart(fechaDesde),
      fecha_hasta: toIsoDayEnd(fechaHasta),
    };
    try {
      const [listado, inds] = await Promise.all([
        listAuditoria({ ...dateParams, page, page_size: 20 }),
        getAuditoriaIndicadores(dateParams),
      ]);
      setRows(listado.results);
      setCount(listado.count);
      setPageSize(listado.page_size);
      setIndicadores(inds);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la auditoría.");
      setRows([]);
      setCount(0);
      setIndicadores(null);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / Math.max(pageSize, 1))),
    [count, pageSize],
  );

  const hayFiltrosActivos = fechaDesde !== "" || fechaHasta !== "";

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Trazabilidad"
        title="Auditorías"
        subtitle="Registro del servidor de acciones del super admin sobre solicitudes de adelanto."
      />

      {error && (
        <p className="mb-4 text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          {error}
        </p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <AdminMetricCard
          label="Total en listado"
          icon={ClipboardList}
          iconTone="trending"
          value={loading ? "…" : String(count)}
          sub="según filtros de fecha"
          accent
        />
        <AdminMetricCard
          label="En revisión"
          icon={Eye}
          iconTone="wallet"
          value={loading ? "…" : String(indicadores?.en_revision ?? 0)}
          sub="solicitudes actuales"
        />
        <AdminMetricCard
          label="Aprobaciones"
          icon={CheckCircle2}
          iconTone="success"
          value={loading ? "…" : String(indicadores?.aprobadas ?? 0)}
          sub="acciones auditadas"
        />
        <AdminMetricCard
          label="Rechazos"
          icon={XCircle}
          iconTone="default"
          value={loading ? "…" : String(indicadores?.rechazadas ?? 0)}
          sub="acciones auditadas"
        />
        <AdminMetricCard
          label="Pagos confirmados"
          icon={Banknote}
          iconTone="success"
          value={loading ? "…" : String(indicadores?.pagos_confirmados ?? 0)}
          sub="solicitudes pagadas"
        />
      </section>

      <div className="admin-panel-card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-4">
          <Button
            type="button"
            variant="ghost"
            aria-expanded={filtrosAbiertos}
            onClick={() => setFiltrosAbiertos((open) => !open)}
            className="group h-9 gap-2 px-2 -ml-2 font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <SlidersHorizontal className="size-4 text-primary transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110" />
            Filtrar
            {hayFiltrosActivos && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                •
              </span>
            )}
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-all duration-300 group-hover:text-primary",
                filtrosAbiertos && "rotate-180",
              )}
            />
          </Button>
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {count} registro(s)
          </span>
        </div>

        {filtrosAbiertos && (
          <div className="border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5">
              <div className="space-y-1.5">
                <Label htmlFor="auditoria-desde">Desde</Label>
                <Input
                  id="auditoria-desde"
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => {
                    setFechaDesde(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auditoria-hasta">Hasta</Label>
                <Input
                  id="auditoria-hasta"
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => {
                    setFechaHasta(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => {
                    setFechaDesde("");
                    setFechaHasta("");
                    setPage(1);
                  }}
                >
                  Limpiar fechas
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="admin-panel-card-flush">
        <div className="admin-card-toolbar">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary shrink-0" />
            <h2 className="admin-section-title text-lg">Registro de acciones</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground tabular">
              {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table min-w-[48rem]">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-left">Fecha</th>
                <th className="admin-table-th text-left">Super admin</th>
                <th className="admin-table-th text-left">Acción</th>
                <th className="admin-table-th text-left">Solicitud</th>
                <th className="admin-table-th text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 align-top">
                  <td className="tabular text-muted-foreground whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div className="font-medium text-sm">{row.admin_nombre || "—"}</div>
                  </td>
                  <td>
                    <AccionBadge accion={row.accion} />
                  </td>
                  <td className="tabular text-sm text-muted-foreground">
                    {row.solicitud_id.slice(0, 8)}…
                  </td>
                  <td className="text-sm text-muted-foreground">
                    <span>{estadoUi(row.estado_anterior)}</span>
                    <span className="mx-1.5 text-foreground/40">→</span>
                    <span className="font-medium text-foreground">{estadoUi(row.estado_nuevo)}</span>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No hay registros de auditoría en el servidor para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
