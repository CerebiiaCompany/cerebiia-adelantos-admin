import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin, formatCOP, estadoLabel, type Adelanto, type EstadoAdelanto } from "@/lib/admin-store";
import { ESTADO_BADGE_CLASSES } from "@/lib/adelanto-estado";
import { useAdelantosFilters } from "@/lib/adelantos-filters";
import { exportAdelantosExcel } from "@/lib/export-adelantos-excel";
import { useAdelantoParametros } from "@/hooks/use-adelanto-parametros";
import {
  fetchAdelantosFromApi,
  syncAprobarSolicitud,
  syncMarcarEnRevision,
  syncRechazarSolicitud,
  syncSubirComprobante,
} from "@/lib/adelantos-api-sync";
import { listCuotasSolicitud } from "@/lib/api/adelantos";
import { ApiError } from "@/lib/api/errors";
import { isBackendUuid } from "@/lib/api/is-api-id";
import type { CuotaAdelantoApi } from "@/lib/api/types";
import type { DesgloseAdelanto } from "@/lib/adelanto-calculo";
import { esPagoACuotas } from "@/lib/adelanto-calculo";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdelantosFiltersPanel } from "@/components/admin/adelantos-filters-panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Eye,
  Upload,
  Copy,
  CheckCircle2,
  FileCheck2,
  Inbox,
  MessageSquareText,
  FileText,
  ImageIcon,
  X,
  CircleCheck,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/admin/adelantos")({
  head: () => ({ meta: [{ title: "Adelantos — Panel" }] }),
  component: AdelantosPage,
});

const ESTADO_COLORS = ESTADO_BADGE_CLASSES;

function AdelantosPage() {
  const { empresas, adelantos, updateAdelantoEstado, rechazarAdelanto, marcarPagado, replaceAdelantos } =
    useAdmin();
  const { calcular } = useAdelantoParametros();
  const [viewing, setViewing] = useState<Adelanto | null>(null);
  const [paying, setPaying] = useState<Adelanto | null>(null);
  const [rejecting, setRejecting] = useState<Adelanto | null>(null);
  const [viewingMotivo, setViewingMotivo] = useState<Adelanto | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const loadStartedRef = useRef(false);

  const loadSolicitudes = useCallback(async () => {
    setLoadingList(true);
    setApiError(null);
    try {
      const fromApi = await fetchAdelantosFromApi();
      replaceAdelantos(fromApi);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las solicitudes desde el servidor.",
      );
    } finally {
      setLoadingList(false);
    }
  }, [replaceAdelantos]);

  useEffect(() => {
    if (loadStartedRef.current) return;
    loadStartedRef.current = true;
    void loadSolicitudes();
  }, [loadSolicitudes]);

  const handleEstadoChange = async (adelanto: Adelanto, nuevoEstado: EstadoAdelanto) => {
    if (adelanto.estado === "pagado") return;
    if (nuevoEstado === "rechazado" && adelanto.estado !== "rechazado") {
      setRejecting(adelanto);
      return;
    }

    if (nuevoEstado === "en_revision" && adelanto.estado === "solicitado") {
      setApiLoading(true);
      setApiError(null);
      try {
        await syncMarcarEnRevision(adelanto.id);
      } catch (err) {
        if (isBackendUuid(adelanto.id)) {
          setApiError(
            err instanceof ApiError
              ? err.message
              : "No se pudo marcar la solicitud en revisión.",
          );
          setApiLoading(false);
          return;
        }
      } finally {
        setApiLoading(false);
      }
    }

    if (
      nuevoEstado === "aprobado" &&
      (adelanto.estado === "solicitado" || adelanto.estado === "en_revision")
    ) {
      setApiLoading(true);
      setApiError(null);
      try {
        await syncAprobarSolicitud(adelanto.id);
      } catch (err) {
        if (isBackendUuid(adelanto.id)) {
          setApiError(
            err instanceof ApiError
              ? err.message
              : "No se pudo aprobar la solicitud en el servidor.",
          );
          setApiLoading(false);
          return;
        }
      } finally {
        setApiLoading(false);
      }
    }

    updateAdelantoEstado(adelanto.id, nuevoEstado);
  };

  const handleMarcarPagado = async (id: string, file: File) => {
    setApiLoading(true);
    setApiError(null);
    try {
      const comprobanteUrl = await syncSubirComprobante(id, file);
      marcarPagado(id, comprobanteUrl ?? file.name);
    } catch (err) {
      if (isBackendUuid(id)) {
        const message =
          err instanceof ApiError
            ? err.message
            : "No se pudo registrar el comprobante en el servidor.";
        setApiError(message);
        setApiLoading(false);
        throw new Error(message);
      }
      marcarPagado(id, file.name);
    } finally {
      setApiLoading(false);
    }
  };

  const handleRechazar = async (motivo: string) => {
    if (!rejecting) return;
    setApiLoading(true);
    setApiError(null);
    try {
      await syncRechazarSolicitud(rejecting.id, motivo);
      rechazarAdelanto(rejecting.id, motivo);
      setRejecting(null);
    } catch (err) {
      if (isBackendUuid(rejecting.id)) {
        setApiError(
          err instanceof ApiError ? err.message : "No se pudo rechazar la solicitud en el servidor.",
        );
      } else {
        rechazarAdelanto(rejecting.id, motivo);
        setRejecting(null);
      }
    } finally {
      setApiLoading(false);
    }
  };

  const {
    months,
    mes,
    setMes,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    empresaId,
    setEmpresaId,
    estado,
    setEstado,
    filtered,
    clearFilters,
    hasActiveFilters,
  } = useAdelantosFilters(adelantos, empresas, {
    defaultEstados: ["en_revision", "aprobado"],
    sortOrder: "asc",
  });

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = () => {
    if (!filtered.length) return;
    setExporting(true);
    try {
      exportAdelantosExcel(filtered, empresas, calcular, "adelantos");
    } finally {
      setExporting(false);
    }
  };

  const pendientesSolicitados = useMemo(
    () =>
      adelantos
        .filter((a) => a.estado === "solicitado")
        .sort((a, b) => +new Date(a.fechaSolicitud) - +new Date(b.fechaSolicitud)),
    [adelantos],
  );

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Operaciones"
        title="Adelantos"
        subtitle="Consulta y gestiona las solicitudes de adelanto realizadas por los empleados."
      />

      {apiError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 space-y-2">
          <p className="text-sm text-destructive">{apiError}</p>
          <p className="text-xs text-muted-foreground">
            Se muestran datos locales de demostración hasta que el servidor responda correctamente.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            disabled={loadingList}
            onClick={() => void loadSolicitudes()}
          >
            {loadingList ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Reintentando…
              </>
            ) : (
              "Reintentar carga"
            )}
          </Button>
        </div>
      )}

      {loadingList && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Cargando solicitudes…
        </p>
      )}

      <div className="admin-panel-card-flush border border-info/25">
        <div className="admin-card-toolbar bg-info/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <Inbox className="size-5 shrink-0 text-info" strokeWidth={2} />
            <div className="min-w-0">
              <h2 className="admin-section-title">Pendientes por responder</h2>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                Solicitudes nuevas en orden de llegada — la más antigua primero.
              </p>
            </div>
          </div>
          <span className="text-sm font-medium text-info tabular shrink-0">
            {pendientesSolicitados.length} en cola
          </span>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-center w-12">#</th>
                <th className="admin-table-th text-left">Empleado</th>
                <th className="admin-table-th text-left hidden md:table-cell">Empresa</th>
                <th className="admin-table-th text-left">Fecha</th>
                <th className="admin-table-th text-right">Monto solicitado</th>
                <th className="admin-table-th text-right">Total a recibir</th>
                <th className="admin-table-th text-center">Cuotas</th>
                <th className="admin-table-th text-right">Valor cuota</th>
                <th className="admin-table-th text-right hidden sm:table-cell">Comisión</th>
                <th className="admin-table-th text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendientesSolicitados.map((a, index) => {
                const e = empresas.find((x) => x.id === a.empresaId);
                const empresaNombre = a.empresaNombre ?? e?.nombre;
                return (
                  <AdelantoRow
                    key={a.id}
                    adelanto={a}
                    empresaNombre={empresaNombre}
                    queueIndex={index + 1}
                    showQueue
                    showFecha
                    desglose={calcular(a.monto, a.numeroCuotas)}
                    onEstadoChange={(v) => handleEstadoChange(a, v)}
                  />
                );
              })}
              {pendientesSolicitados.length === 0 && (
                <tr>
                  <td colSpan={10} className="admin-table-empty py-8">
                    No hay solicitudes nuevas pendientes de respuesta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdelantosFiltersPanel
        months={months}
        mes={mes}
        setMes={setMes}
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        setFechaDesde={setFechaDesde}
        setFechaHasta={setFechaHasta}
        showFechaRango
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

      <div className="admin-panel-card-flush">
        <div className="admin-card-toolbar">
          <div>
            <h2 className="admin-section-title">En gestión</h2>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              En revisión y aprobadas, de la más antigua a la más nueva. Rechazadas y pagadas solo al filtrar por estado.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} registros</span>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-left">Empleado</th>
                <th className="admin-table-th text-left hidden md:table-cell">Empresa</th>
                <th className="admin-table-th text-left hidden lg:table-cell">Fecha</th>
                <th className="admin-table-th text-right">Monto solicitado</th>
                <th className="admin-table-th text-right">Total a recibir</th>
                <th className="admin-table-th text-center">Cuotas</th>
                <th className="admin-table-th text-right">Valor cuota</th>
                <th className="admin-table-th text-right hidden sm:table-cell">Comisión</th>
                <th className="admin-table-th text-center">Estado</th>
                <th className="admin-table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const e = empresas.find((x) => x.id === a.empresaId);
                const empresaNombre = a.empresaNombre ?? e?.nombre;
                return (
                  <AdelantoRow
                    key={a.id}
                    adelanto={a}
                    empresaNombre={empresaNombre}
                    desglose={calcular(a.monto, a.numeroCuotas)}
                    allowedEstados={["aprobado", "rechazado"]}
                    onEstadoChange={(v) => handleEstadoChange(a, v)}
                    onView={a.estado === "aprobado" ? () => setViewing(a) : undefined}
                    onPay={a.estado === "aprobado" ? () => setPaying(a) : undefined}
                    onViewMotivo={a.estado === "rechazado" ? () => setViewingMotivo(a) : undefined}
                  />
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="admin-table-empty">
                    {hasActiveFilters
                      ? "No hay solicitudes que coincidan con los filtros seleccionados."
                      : adelantos.length > 0
                        ? "No hay solicitudes en revisión ni aprobadas en este momento."
                        : "No hay solicitudes de adelanto registradas."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CuentaDialog
        adelanto={viewing}
        empresa={viewing ? empresas.find((x) => x.id === viewing.empresaId)?.nombre : undefined}
        onClose={() => setViewing(null)}
      />
      <PagoDialog
        adelanto={paying}
        desglose={paying ? calcular(paying.monto, paying.numeroCuotas) : null}
        onClose={() => setPaying(null)}
        onPagar={async (file) => {
          if (paying) await handleMarcarPagado(paying.id, file);
        }}
        loading={apiLoading}
      />
      <RechazoDialog
        adelanto={rejecting}
        empresa={rejecting ? empresas.find((x) => x.id === rejecting.empresaId)?.nombre : undefined}
        onClose={() => setRejecting(null)}
        onConfirm={handleRechazar}
        loading={apiLoading}
      />
      <MotivoRechazoDialog
        adelanto={viewingMotivo}
        empresa={viewingMotivo ? empresas.find((x) => x.id === viewingMotivo.empresaId)?.nombre : undefined}
        onClose={() => setViewingMotivo(null)}
      />
    </div>
  );
}

type AdelantoRowProps = {
  adelanto: Adelanto;
  empresaNombre?: string;
  desglose: DesgloseAdelanto;
  queueIndex?: number;
  showQueue?: boolean;
  showFecha?: boolean;
  allowedEstados?: EstadoAdelanto[];
  onEstadoChange: (estado: EstadoAdelanto) => void;
  onView?: () => void;
  onPay?: () => void;
  onViewMotivo?: () => void;
};

function AdelantoCuotasCells({ desglose }: { desglose: DesgloseAdelanto }) {
  const aCuotas = esPagoACuotas(desglose.numeroCuotas);

  return (
    <>
      <td className="text-center">
        <span
          className={cn(
            "inline-flex min-w-8 items-center justify-center rounded-md px-2 py-1 text-sm font-semibold tabular",
            aCuotas ? "bg-warning/15 text-warning" : "bg-success/15 text-success",
          )}
        >
          {desglose.numeroCuotas}
        </span>
        <p className="admin-table-cell-note sm:hidden mt-1 tabular">
          {aCuotas ? "A cuotas" : "Pago único"}
        </p>
      </td>
      <td className="text-right">
        <div className="admin-table-cell-money tabular">{formatCOP(desglose.valorCuota)}</div>
        <div className="admin-table-cell-note tabular">
          {desglose.numeroCuotas} × sobre monto solicitado
        </div>
        <div className="admin-table-cell-note sm:hidden tabular mt-0.5">
          Com. {formatCOP(desglose.valorComision)}
        </div>
      </td>
      <td className="hidden sm:table-cell text-right">
        <div className="admin-table-cell-money tabular text-muted-foreground">
          {formatCOP(desglose.valorComision)}
        </div>
        <div className="admin-table-cell-note tabular">
          {formatCOP(desglose.tarifaComision)} × {desglose.numeroCuotas} cuota(s)
        </div>
      </td>
    </>
  );
}

function AdelantoRow({
  adelanto: a,
  empresaNombre,
  desglose,
  queueIndex,
  showQueue,
  showFecha,
  allowedEstados,
  onEstadoChange,
  onView,
  onPay,
  onViewMotivo,
}: AdelantoRowProps) {
  return (
    <tr
      className={cn(
        "hover:bg-muted/30",
        esPagoACuotas(desglose.numeroCuotas) && "bg-warning/[0.05]",
        !esPagoACuotas(desglose.numeroCuotas) && "bg-success/[0.03]",
      )}
    >
      {showQueue && (
        <td className="text-center">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-info/10 text-sm font-semibold text-info tabular">
            {queueIndex}
          </span>
        </td>
      )}
      <td>
        <div className="admin-table-cell-title">{a.empleadoNombre}</div>
        <div className="admin-table-cell-note tabular">CC {a.empleadoCedula}</div>
        <div className="admin-table-cell-note md:hidden truncate mt-0.5">{empresaNombre}</div>
        {a.estado === "rechazado" && a.motivoRechazo && (
          <p className="text-xs text-destructive/90 mt-1 line-clamp-2" title={a.motivoRechazo}>
            {a.motivoRechazo}
          </p>
        )}
      </td>
      <td className="hidden md:table-cell text-muted-foreground">{empresaNombre}</td>
      <td
        className={
          showFecha
            ? "text-muted-foreground tabular"
            : "hidden lg:table-cell text-muted-foreground tabular"
        }
      >
        {new Date(a.fechaSolicitud).toLocaleDateString("es-CO")}
      </td>
      <td className="text-right">
        <div className="admin-table-cell-money tabular">{formatCOP(desglose.montoSolicitado)}</div>
        <div className="admin-table-cell-note">solicitado</div>
      </td>
      <td className="text-right">
        <div className="admin-table-cell-money tabular text-primary font-semibold">
          {formatCOP(a.montoNeto ?? desglose.totalARecibir)}
        </div>
        <div className="admin-table-cell-note">neto al empleado</div>
      </td>
      <AdelantoCuotasCells desglose={desglose} />
      <td>
        <div className="flex justify-center">
          {showQueue ? (
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 whitespace-nowrap"
              onClick={() => onEstadoChange("en_revision")}
              title="Mover la solicitud a revisión"
            >
              <Eye className="size-4 shrink-0" />
              Enviar a revisión
            </Button>
          ) : (
            <EstadoSelect
              value={a.estado}
              onChange={onEstadoChange}
              allowedEstados={allowedEstados}
            />
          )}
        </div>
      </td>
      {!showQueue && (
        <td>
          <div className="flex justify-end gap-1.5">
            {a.estado === "aprobado" && onView && onPay && (
              <>
                <Button size="icon" variant="ghost" className="size-10" onClick={onView} title="Ver cuenta">
                  <Eye className="size-5" />
                </Button>
                <Button size="sm" onClick={onPay} className="h-9 px-2 sm:px-3 text-sm">
                  <Upload className="size-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Pagar</span>
                </Button>
              </>
            )}
            {a.estado === "pagado" && (
              <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
                <FileCheck2 className="size-4" /> Comprobante
              </span>
            )}
            {a.estado === "rechazado" && onViewMotivo && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-2 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onViewMotivo}
              >
                <MessageSquareText className="size-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Motivo</span>
              </Button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

function EstadoBadge({ estado }: { estado: EstadoAdelanto }) {
  return (
    <span
      className={`inline-flex items-center text-sm font-medium rounded-md border px-2.5 py-1 ${ESTADO_COLORS[estado]}`}
    >
      {estadoLabel[estado]}
    </span>
  );
}

function EstadoSelect({
  value,
  onChange,
  allowedEstados,
}: {
  value: EstadoAdelanto;
  onChange: (v: EstadoAdelanto) => void;
  /** Si se define, solo muestra esos estados en el menú (p. ej. tabla En gestión). */
  allowedEstados?: EstadoAdelanto[];
}) {
  if (value === "pagado") {
    return (
      <div className="flex justify-center" title="El estado Pagado no se puede modificar">
        <EstadoBadge estado="pagado" />
      </div>
    );
  }

  const opciones = (Object.keys(estadoLabel) as EstadoAdelanto[]).filter((e) => e !== "pagado");
  const estadosVisibles = allowedEstados
    ? opciones.filter((e) => allowedEstados.includes(e))
    : opciones;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as EstadoAdelanto)}>
      <SelectTrigger className="h-9 px-2.5 w-auto border-none bg-transparent hover:bg-muted/50 [&>svg]:size-4">
        <SelectValue asChild>
          <EstadoBadge estado={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {estadosVisibles.map((e) => (
          <SelectItem key={e} value={e}>
            {estadoLabel[e]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-medium tabular">{value}</div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? <CheckCircle2 className="size-4 text-success" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}

function CuentaDialog({
  adelanto,
  empresa,
  onClose,
}: {
  adelanto: Adelanto | null;
  empresa?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!adelanto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datos para el pago</DialogTitle>
        </DialogHeader>
        {adelanto && (
          <div>
            <div className="rounded-lg bg-surface border border-border p-4 mb-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Beneficiario</div>
              <div className="font-semibold">{adelanto.empleadoNombre}</div>
              <div className="text-xs text-muted-foreground">
                CC {adelanto.empleadoCedula} · {empresa}
              </div>
            </div>
            <CopyRow label="Banco" value={adelanto.cuenta.banco} />
            <CopyRow label="Tipo de cuenta" value={adelanto.cuenta.tipo} />
            <CopyRow label="Número de cuenta" value={adelanto.cuenta.numero} />
            <CopyRow label="Monto a transferir" value={formatCOP(adelanto.monto)} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RechazoDialog({
  adelanto,
  empresa,
  onClose,
  onConfirm,
  loading = false,
}: {
  adelanto: Adelanto | null;
  empresa?: string;
  onClose: () => void;
  onConfirm: (motivo: string) => void | Promise<void>;
  loading?: boolean;
}) {
  const [motivo, setMotivo] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMotivo("");
      onClose();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nota = motivo.trim();
    if (!nota || loading) return;
    await onConfirm(nota);
    setMotivo("");
  };

  return (
    <Dialog open={!!adelanto} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar solicitud</DialogTitle>
        </DialogHeader>
        {adelanto && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
              <div className="text-sm font-medium">{adelanto.empleadoNombre}</div>
              <div className="text-xs text-muted-foreground mt-1">
                CC {adelanto.empleadoCedula}
                {empresa ? ` · ${empresa}` : ""} · {formatCOP(adelanto.monto)}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="motivo-rechazo">
                Motivo del rechazo <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo-rechazo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describe el motivo por el cual se rechaza esta solicitud…"
                rows={4}
                required
                minLength={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Este motivo quedará registrado y será visible al consultar la solicitud rechazada.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={motivo.trim().length < 5 || loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Rechazando…
                  </>
                ) : (
                  "Confirmar rechazo"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MotivoRechazoDialog({
  adelanto,
  empresa,
  onClose,
}: {
  adelanto: Adelanto | null;
  empresa?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!adelanto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motivo del rechazo</DialogTitle>
        </DialogHeader>
        {adelanto && (
          <div className="space-y-4">
            <div className="rounded-lg bg-surface border border-border p-4">
              <div className="font-semibold">{adelanto.empleadoNombre}</div>
              <div className="text-xs text-muted-foreground mt-1">
                CC {adelanto.empleadoCedula}
                {empresa ? ` · ${empresa}` : ""}
              </div>
              {adelanto.fechaRechazo && (
                <div className="text-xs text-muted-foreground mt-2 tabular">
                  Rechazado el{" "}
                  {new Date(adelanto.fechaRechazo).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{adelanto.motivoRechazo}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ComprobanteUploadZone({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file?.type.startsWith("image/")) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickFile = (candidate: File | undefined) => {
    if (!candidate) return;
    const valid = candidate.type.startsWith("image/") || candidate.type === "application/pdf";
    if (!valid) return;
    onFileChange(candidate);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  if (file) {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    return (
      <div className="w-full min-w-0 rounded-xl border border-success/30 bg-success/5 overflow-hidden">
        {isImage && previewUrl && (
          <div className="relative border-b border-success/20 bg-muted/20 overflow-hidden">
            <img
              src={previewUrl}
              alt="Vista previa del comprobante"
              className="mx-auto block max-h-28 sm:max-h-40 w-full max-w-full object-contain p-2"
            />
          </div>
        )}
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 min-w-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
            {isPdf ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatFileSize(file.size)} · Archivo listo
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onFileChange(null)}
            title="Quitar archivo"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex w-full min-w-0 flex-col items-center justify-center gap-2.5 sm:gap-3 rounded-xl border-2 border-dashed px-4 py-6 sm:px-6 sm:py-8 text-center transition-colors cursor-pointer",
        dragging
          ? "border-primary bg-primary/10"
          : "border-border bg-surface-2/60 hover:border-primary/45 hover:bg-primary/5",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
        <Upload className="size-7" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Arrastra tu comprobante aquí</p>
        <p className="text-xs text-muted-foreground">
          o{" "}
          <span className="font-medium text-primary underline-offset-2 hover:underline">
            selecciona un archivo
          </span>{" "}
          en tu dispositivo
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-md border border-border bg-background px-2 py-0.5">JPG / PNG</span>
        <span className="rounded-md border border-border bg-background px-2 py-0.5">PDF</span>
      </div>
    </div>
  );
}

function PagoDialog({
  adelanto,
  desglose,
  onClose,
  onPagar,
  loading = false,
}: {
  adelanto: Adelanto | null;
  desglose: DesgloseAdelanto | null;
  onClose: () => void;
  onPagar: (file: File) => void | Promise<void>;
  loading?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [cuotas, setCuotas] = useState<CuotaAdelantoApi[] | null>(null);
  const [cuotasError, setCuotasError] = useState<string | null>(null);

  useEffect(() => {
    if (!adelanto || !isBackendUuid(adelanto.id)) {
      setCuotas(null);
      setCuotasError(null);
      return;
    }

    let cancelled = false;
    setCuotas(null);
    setCuotasError(null);

    void listCuotasSolicitud(adelanto.id)
      .then((data) => {
        if (!cancelled) setCuotas(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setCuotasError(err instanceof ApiError ? err.message : "No se pudo cargar el cronograma.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adelanto]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFile(null);
      onClose();
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || loading) return;
    try {
      await onPagar(file);
      setFile(null);
      onClose();
    } catch {
      // El error se muestra en la página principal.
    }
  };

  return (
    <Dialog open={!!adelanto} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md gap-3 sm:gap-4">
        <DialogHeader className="pr-8">
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Adjunta el comprobante de la transferencia para cerrar esta solicitud.
          </DialogDescription>
        </DialogHeader>
        {adelanto && (
          <form onSubmit={submit} className="space-y-4 sm:space-y-5 min-w-0">
            <div className="rounded-xl border border-border bg-surface/80 p-3 sm:p-4 min-w-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Beneficiario
                  </p>
                  <p className="text-sm font-semibold truncate mt-1">{adelanto.empleadoNombre}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {adelanto.cuenta.banco} · {adelanto.cuenta.numero}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block sm:text-right shrink-0 border-t border-border/60 pt-3 sm:border-0 sm:pt-0">
                  <p className="text-xs text-muted-foreground sm:hidden">Total a transferir</p>
                  <div>
                    <p className="hidden sm:block text-xs text-muted-foreground">Total a recibir</p>
                    <p className="text-base sm:text-lg font-bold tabular text-primary">
                      {desglose ? formatCOP(desglose.totalARecibir) : formatCOP(adelanto.monto)}
                    </p>
                    {desglose && (
                      <p className="text-[11px] text-muted-foreground tabular mt-0.5">
                        Solicitado {formatCOP(desglose.montoSolicitado)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {desglose && (
                <div className="mt-3 pt-3 border-t border-border/70 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Cuotas</p>
                    <p className="font-semibold tabular mt-0.5">{desglose.numeroCuotas}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor cuota</p>
                    <p className="font-semibold tabular mt-0.5">{formatCOP(desglose.valorCuota)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comisión total</p>
                    <p className="font-semibold tabular mt-0.5">
                      {formatCOP(desglose.valorComision)}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({formatCOP(desglose.tarifaComision)} × {desglose.numeroCuotas})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monto solicitado</p>
                    <p className="font-semibold tabular mt-0.5">{formatCOP(desglose.montoSolicitado)}</p>
                  </div>
                </div>
              )}
            </div>

            {cuotas && cuotas.length > 0 && (
              <div className="rounded-xl border border-border bg-surface/60 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cronograma de cuotas
                </p>
                <ul className="space-y-1.5 text-sm">
                  {cuotas.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5"
                    >
                      <span className="tabular font-medium">
                        Cuota {c.numero} · corte {c.fecha_corte}
                      </span>
                      <span className="tabular text-muted-foreground">{formatCOP(Number(c.monto))}</span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          c.estado === "pagada" ? "text-success" : "text-warning",
                        )}
                      >
                        {c.estado === "pagada" ? "Pagada" : "Pendiente"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cuotasError && <p className="text-xs text-muted-foreground">{cuotasError}</p>}

            <div className="space-y-2 min-w-0">
              <Label>Comprobante de pago</Label>
              <ComprobanteUploadZone file={file} onFileChange={setFile} />
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl border border-success/25 bg-success/5 px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
              <CircleCheck className="size-4 sm:size-5 shrink-0 text-success mt-0.5" />
              <p className="text-xs leading-relaxed text-muted-foreground min-w-0">
                Al confirmar, la solicitud pasará automáticamente a estado{" "}
                <span className="font-semibold text-success">Pagado</span> y no podrá modificarse
                después.
              </p>
            </div>

            <DialogFooter className="gap-2 pt-1 sm:pt-0">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!file || loading}
                className="w-full sm:w-auto sm:min-w-[9.5rem]"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Registrando…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Confirmar pago
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
