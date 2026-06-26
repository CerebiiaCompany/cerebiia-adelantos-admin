import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAdmin, formatCOP, estadoLabel } from "@/lib/admin-store";
import {
  accionAuditoriaLabel,
  ACCION_AUDITORIA_BADGE,
  type AccionAuditoria,
  type RegistroAuditoria,
} from "@/lib/auditoria";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Eye,
  CheckCircle2,
  XCircle,
  Banknote,
  ShieldCheck,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/admin/auditorias")({
  head: () => ({ meta: [{ title: "Auditorías — Panel" }] }),
  component: AuditoriasPage,
});

const ACCIONES: AccionAuditoria[] = [
  "paso_revision",
  "aprobacion",
  "rechazo",
  "pago_confirmado",
];

function AccionBadge({ accion }: { accion: AccionAuditoria }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        ACCION_AUDITORIA_BADGE[accion],
      )}
    >
      {accionAuditoriaLabel[accion]}
    </span>
  );
}

function AuditoriasPage() {
  const { empresas, auditorias } = useAdmin();
  const [accion, setAccion] = useState<AccionAuditoria | "all">("all");
  const [empresaId, setEmpresaId] = useState("all");
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const empresaNombre = useMemo(() => {
    const map = new Map(empresas.map((e) => [e.id, e.nombre]));
    return (id: string) => map.get(id) ?? "—";
  }, [empresas]);

  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const desde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
    const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null;

    return auditorias.filter((row) => {
      if (accion !== "all" && row.accion !== accion) return false;
      if (empresaId !== "all" && row.empresaId !== empresaId) return false;

      const ts = new Date(row.timestamp);
      if (desde && ts < desde) return false;
      if (hasta && ts > hasta) return false;

      if (!q) return true;
      return (
        row.actorNombre.toLowerCase().includes(q) ||
        row.actorEmail.toLowerCase().includes(q) ||
        row.empleadoNombre.toLowerCase().includes(q) ||
        row.empleadoCedula.includes(q) ||
        empresaNombre(row.empresaId).toLowerCase().includes(q)
      );
    });
  }, [auditorias, accion, empresaId, busqueda, fechaDesde, fechaHasta, empresaNombre]);

  const stats = useMemo(() => {
    const count = (a: AccionAuditoria) => filtered.filter((r) => r.accion === a).length;
    return {
      total: filtered.length,
      revision: count("paso_revision"),
      aprobacion: count("aprobacion"),
      rechazo: count("rechazo"),
      pago: count("pago_confirmado"),
    };
  }, [filtered]);

  const hayFiltrosActivos =
    accion !== "all" ||
    empresaId !== "all" ||
    busqueda.trim() !== "" ||
    fechaDesde !== "" ||
    fechaHasta !== "";

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Trazabilidad"
        title="Auditorías"
        subtitle="Informe de acciones del super admin sobre solicitudes de adelanto: revisiones, aprobaciones, rechazos y pagos confirmados."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <AdminMetricCard
          label="Total acciones"
          icon={ClipboardList}
          iconTone="trending"
          value={String(stats.total)}
          sub="según filtros aplicados"
          accent
        />
        <AdminMetricCard
          label="Pasaron a revisión"
          icon={Eye}
          iconTone="wallet"
          value={String(stats.revision)}
          sub="cambios de estado"
        />
        <AdminMetricCard
          label="Aprobaciones"
          icon={CheckCircle2}
          iconTone="success"
          value={String(stats.aprobacion)}
          sub="solicitudes aprobadas"
        />
        <AdminMetricCard
          label="Rechazos"
          icon={XCircle}
          iconTone="default"
          value={String(stats.rechazo)}
          sub="con motivo registrado"
        />
        <AdminMetricCard
          label="Pagos confirmados"
          icon={Banknote}
          iconTone="success"
          value={String(stats.pago)}
          sub="comprobante adjuntado"
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
          <span className="text-sm text-muted-foreground">
            {filtered.length} registro(s)
          </span>
        </div>

        {filtrosAbiertos && (
          <div className="border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 p-4 sm:p-5">
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="auditoria-busqueda">Buscar</Label>
              <Input
                id="auditoria-busqueda"
                placeholder="Admin, empleado, cédula o empresa…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Acción</Label>
              <Select value={accion} onValueChange={(v) => setAccion(v as AccionAuditoria | "all")}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {ACCIONES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {accionAuditoriaLabel[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="h-10">
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
              <Label htmlFor="auditoria-desde">Desde</Label>
              <Input
                id="auditoria-desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="auditoria-hasta">Hasta</Label>
              <Input
                id="auditoria-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
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
          <span className="text-sm text-muted-foreground">{filtered.length} registro(s)</span>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table min-w-[56rem]">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-left">Fecha</th>
                <th className="admin-table-th text-left">Super admin</th>
                <th className="admin-table-th text-left">Acción</th>
                <th className="admin-table-th text-left">Empleado</th>
                <th className="admin-table-th text-left hidden lg:table-cell">Empresa</th>
                <th className="admin-table-th text-right">Monto</th>
                <th className="admin-table-th text-left hidden md:table-cell">Estado</th>
                <th className="admin-table-th text-left hidden xl:table-cell">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((row) => (
                <AuditoriaRow key={row.id} row={row} empresa={empresaNombre(row.empresaId)} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    {auditorias.length === 0
                      ? "Aún no hay acciones registradas. Los cambios de estado en Adelantos aparecerán aquí automáticamente."
                      : "No hay registros con los filtros seleccionados."}
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

function AuditoriaRow({ row, empresa }: { row: RegistroAuditoria; empresa: string }) {
  return (
    <tr className="hover:bg-muted/30 align-top">
      <td className="tabular text-muted-foreground whitespace-nowrap">
        {new Date(row.timestamp).toLocaleString("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </td>
      <td>
        <div className="font-medium text-sm">{row.actorNombre}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[12rem]">{row.actorEmail}</div>
      </td>
      <td>
        <AccionBadge accion={row.accion} />
      </td>
      <td>
        <div className="font-medium text-sm">{row.empleadoNombre}</div>
        <div className="text-xs text-muted-foreground tabular">{row.empleadoCedula}</div>
        <div className="text-xs text-muted-foreground lg:hidden mt-0.5">{empresa}</div>
      </td>
      <td className="hidden lg:table-cell text-sm">{empresa}</td>
      <td className="text-right admin-table-cell-money tabular">{formatCOP(row.monto)}</td>
      <td className="hidden md:table-cell text-sm text-muted-foreground">
        <span>{estadoLabel[row.estadoAnterior]}</span>
        <span className="mx-1.5 text-foreground/40">→</span>
        <span className="font-medium text-foreground">{estadoLabel[row.estadoNuevo]}</span>
      </td>
      <td className="hidden xl:table-cell text-sm text-muted-foreground max-w-[16rem]">
        {row.detalle ?? "—"}
      </td>
    </tr>
  );
}
