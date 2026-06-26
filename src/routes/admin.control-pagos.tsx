import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAdmin, formatCOP, type Adelanto, type Empleado } from "@/lib/admin-store";
import { useAdelantoParametros } from "@/hooks/use-adelanto-parametros";
import {
  buildResumenesCobroEmpresa,
  buildTarjetasCobroPorEmpresa,
  totalCobroPendiente,
  ESTADO_CUENTA_COBRO_CLASSES,
  estadoCuentaCobroLabel,
  listarPeriodosConPagos,
  periodoFromDate,
  periodoLabel,
  type ResumenCobroEmpresa,
  type EstadoCuentaCobro,
} from "@/lib/cuenta-cobro";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdelantosPorEmpresa } from "@/components/admin/adelantos-filters-panel";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildFilasDetalleCuotas,
  buildResumenSaldosEmpresa,
  sumarCuotasNominaInformadas,
  formatPeriodoDescuento,
  formatFechaSolicitud,
  type FilaDetalleCuota,
} from "@/lib/cuotas-adelanto";
import { cn } from "@/lib/utils";
import {
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  Landmark,
  ListChecks,
  Upload,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/control-pagos")({
  head: () => ({ meta: [{ title: "Control de pagos — Panel" }] }),
  component: ControlPagosPage,
});

function ControlPagosPage() {
  const {
    empresas,
    adelantos,
    empleados,
    cuentasCobro,
    crearCuentaCobro,
    adjuntarDocumentoCobro,
    registrarEvidenciaPagoEmpresa,
    verificarCuentaCobro,
    rechazarEvidenciaCuenta,
  } = useAdmin();
  const { valorComision } = useAdelantoParametros();

  const periodos = useMemo(() => {
    const list = listarPeriodosConPagos(adelantos);
    const actual = periodoFromDate(new Date());
    if (!list.includes(actual)) list.unshift(actual);
    return list.length ? list : [actual];
  }, [adelantos]);

  const [periodo, setPeriodo] = useState(() => periodoFromDate(new Date()));
  const [detalle, setDetalle] = useState<ResumenCobroEmpresa | null>(null);
  const [detalleCuotas, setDetalleCuotas] = useState<ResumenCobroEmpresa | null>(null);
  const [adjuntarCobro, setAdjuntarCobro] = useState<ResumenCobroEmpresa | null>(null);
  const [revisar, setRevisar] = useState<ResumenCobroEmpresa | null>(null);

  const resumenesConCuenta = useMemo(
    () => buildResumenesCobroEmpresa(adelantos, empresas, cuentasCobro, periodo, valorComision),
    [adelantos, empresas, cuentasCobro, periodo, valorComision],
  );

  const tarjetasCobro = useMemo(
    () => buildTarjetasCobroPorEmpresa(resumenesConCuenta),
    [resumenesConCuenta],
  );

  const stats = useMemo(() => {
    const totalCobrar = totalCobroPendiente(resumenesConCuenta);
    const pendientes = resumenesConCuenta.filter(
      (r) => r.cuentaCobro?.estado === "evidencia_enviada",
    ).length;
    const verificadas = resumenesConCuenta.filter(
      (r) => r.cuentaCobro?.estado === "verificada",
    ).length;
    return { totalCobrar, pendientes, verificadas, empresas: resumenesConCuenta.length };
  }, [resumenesConCuenta]);

  const handleGenerarCuenta = (resumen: ResumenCobroEmpresa) => {
    crearCuentaCobro(
      resumen.empresaId,
      resumen.periodo,
      resumen.adelantosPagados.map((a) => a.id),
      valorComision,
    );
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Finanzas"
        title="Control de pagos"
        subtitle="Gestiona las cuentas de cobro a empresas. Cobro único por adelanto; al verificar, la deuda queda en $0 y las cuotas son solo para descuento en nómina."
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminMetricCard
          label="Total a cobrar"
          icon={Landmark}
          iconTone="trending"
          value={formatCOP(stats.totalCobrar)}
          sub={`${stats.empresas} empresa(s) · ${periodoLabel(periodo)}`}
          accent
        />
        <AdminMetricCard
          label="Por verificar"
          icon={Eye}
          iconTone="wallet"
          value={String(stats.pendientes)}
          sub="evidencia de empresa recibida"
        />
        <AdminMetricCard
          label="Verificadas"
          icon={CheckCircle2}
          iconTone="success"
          value={String(stats.verificadas)}
          sub="cobro saldado con empresa"
        />
        <AdminMetricCard
          label="Comisión aplicada"
          icon={FileText}
          iconTone="building"
          value={formatCOP(Number(valorComision) || 0)}
          sub="tarifa fija por cuota"
        />
      </section>

      <div className="admin-panel-card space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5 min-w-[200px]">
            <Label>Periodo de cobro</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((p) => (
                  <SelectItem key={p} value={p}>
                    {periodoLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Incluye adelantos pagados al empleado en este periodo. La empresa paga el monto completo
            una sola vez; las cuotas del detalle son solo para que descuente en nómina.
          </p>
        </div>
      </div>

      <AdelantosPorEmpresa
        items={tarjetasCobro}
        modoCobro
        subtitle={`Periodo ${periodoLabel(periodo)}. El monto pasa a $0 al confirmar el pago de la empresa.`}
      />

      <div className="admin-panel-card-flush">
        <div className="admin-card-toolbar">
          <div>
            <h2 className="admin-section-title">Cobro por empresa</h2>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
              Total a cobrar = adelanto completo + comisión. Verificada = deuda $0 (la empresa ya pagó).
            </p>
          </div>
          <span className="text-sm text-muted-foreground tabular">{resumenesConCuenta.length} registros</span>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-left">Empresa</th>
                <th className="admin-table-th text-left hidden md:table-cell">NIT</th>
                <th className="admin-table-th text-left hidden lg:table-cell">Administrador</th>
                <th className="admin-table-th text-center">Adelantos</th>
                <th className="admin-table-th text-right">Monto pagado</th>
                <th className="admin-table-th text-right hidden sm:table-cell">Comisión</th>
                <th className="admin-table-th text-right">Total a cobrar</th>
                <th className="admin-table-th text-center">Estado</th>
                <th className="admin-table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resumenesConCuenta.map((r) => (
                <CobroEmpresaRow
                  key={r.key}
                  resumen={r}
                  onDetalle={() => setDetalle(r)}
                  onDetalleCuotas={() => setDetalleCuotas(r)}
                  onGenerar={() => handleGenerarCuenta(r)}
                  onAdjuntar={() => setAdjuntarCobro(r)}
                  onRevisar={() => setRevisar(r)}
                />
              ))}
              {resumenesConCuenta.length === 0 && (
                <tr>
                  <td colSpan={9} className="admin-table-empty py-10">
                    No hay adelantos pagados en este periodo. Confirma pagos en el módulo Adelantos para
                    generar cuentas de cobro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetalleCobroDialog resumen={detalle} onClose={() => setDetalle(null)} />
      <DetalleCuotasDialog
        resumen={detalleCuotas}
        adelantos={adelantos}
        empleados={empleados}
        valorComision={valorComision}
        onClose={() => setDetalleCuotas(null)}
      />
      <AdjuntarCuentaDialog
        resumen={adjuntarCobro}
        onClose={() => setAdjuntarCobro(null)}
        onPublicar={(resumen, nombreArchivo) => {
          let cuentaId = resumen.cuentaCobro?.id;
          if (!cuentaId) {
            const creada = crearCuentaCobro(
              resumen.empresaId,
              resumen.periodo,
              resumen.adelantosPagados.map((a) => a.id),
              valorComision,
            );
            cuentaId = creada?.id;
          }
          if (cuentaId) adjuntarDocumentoCobro(cuentaId, nombreArchivo);
          setAdjuntarCobro(null);
        }}
      />
      <RevisarEvidenciaDialog
        resumen={revisar}
        onClose={() => setRevisar(null)}
        onVerificar={(id) => {
          verificarCuentaCobro(id);
          setRevisar(null);
        }}
        onRechazar={(id, nota) => {
          rechazarEvidenciaCuenta(id, nota);
          setRevisar(null);
        }}
        onSimularEvidencia={(id, nombre) => {
          registrarEvidenciaPagoEmpresa(id, nombre);
        }}
      />
    </div>
  );
}

function EstadoCuentaBadge({ estado }: { estado?: EstadoCuentaCobro }) {
  if (!estado) {
    return (
      <span className="inline-flex text-xs font-medium rounded-md border px-2 py-0.5 bg-muted/40 text-muted-foreground border-border">
        Sin cuenta
      </span>
    );
  }
  const e = estado;
  return (
    <span
      className={cn(
        "inline-flex text-xs font-medium rounded-md border px-2 py-0.5",
        ESTADO_CUENTA_COBRO_CLASSES[e],
      )}
    >
      {estadoCuentaCobroLabel[e]}
    </span>
  );
}

function CobroEmpresaRow({
  resumen: r,
  onDetalle,
  onDetalleCuotas,
  onGenerar,
  onAdjuntar,
  onRevisar,
}: {
  resumen: ResumenCobroEmpresa;
  onDetalle: () => void;
  onDetalleCuotas: () => void;
  onGenerar: () => void;
  onAdjuntar: () => void;
  onRevisar: () => void;
}) {
  const cuenta = r.cuentaCobro;
  const estado = cuenta?.estado;
  const cobroVerificado = estado === "verificada";
  const totalCobrarFila = cobroVerificado ? 0 : r.montoTotalCobrar;

  return (
    <tr className="hover:bg-muted/30">
      <td>
        <div className="flex items-center gap-3">
          <div className="admin-table-icon-wrap shrink-0">
            <Building2 className="admin-table-icon" />
          </div>
          <div className="min-w-0">
            <div className="admin-table-cell-title truncate">{r.empresa?.nombre ?? "—"}</div>
            <div className="admin-table-cell-note md:hidden tabular">{r.empresa?.nit}</div>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell tabular admin-table-cell-mono text-muted-foreground">
        {r.empresa?.nit ?? "—"}
      </td>
      <td className="hidden lg:table-cell">
        <div className="admin-table-cell-title text-sm">{r.empresa?.adminNombre ?? "—"}</div>
        <div className="admin-table-cell-note truncate">{r.empresa?.adminEmail}</div>
      </td>
      <td className="text-center tabular font-medium">{r.cantidadAdelantos}</td>
      <td className="text-right admin-table-cell-money">{formatCOP(r.montoPagado)}</td>
      <td className="hidden sm:table-cell text-right admin-table-cell-money text-muted-foreground">
        {formatCOP(r.montoComision)}
      </td>
      <td className="text-right admin-table-cell-money text-primary font-semibold">
        {formatCOP(totalCobrarFila)}
      </td>
      <td className="text-center">
        <EstadoCuentaBadge estado={estado} />
      </td>
      <td>
        <div className="flex justify-end gap-1 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={onDetalleCuotas}
            title="Detalle de cuotas y saldos"
          >
            <ListChecks className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={onDetalle} title="Resumen de cobro">
            <Eye className="size-4" />
          </Button>
          {!cuenta && (
            <Button size="sm" className="h-8 px-2 text-xs" onClick={onGenerar}>
              Generar cuenta
            </Button>
          )}
          {cuenta && (cuenta.estado === "borrador" || cuenta.estado === "rechazada") && (
            <Button size="sm" className="h-8 px-2 text-xs" onClick={onAdjuntar}>
              <Upload className="size-3.5 mr-1" />
              Cuenta cobro
            </Button>
          )}
          {cuenta && ["emitida", "evidencia_enviada", "rechazada"].includes(cuenta.estado) && (
            <Button size="sm" variant="secondary" className="h-8 px-2 text-xs" onClick={onRevisar}>
              {cuenta.estado === "evidencia_enviada" ? "Revisar" : "Gestionar"}
            </Button>
          )}
          {cuenta?.estado === "emitida" && (
            <span className="text-xs text-muted-foreground self-center px-1 hidden xl:inline">
              Esperando empresa
            </span>
          )}
          {cuenta?.estado === "verificada" && (
            <span className="inline-flex items-center gap-1 text-xs text-success font-medium self-center px-1">
              <CheckCircle2 className="size-3.5" /> OK
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

function DetalleCobroDialog({
  resumen,
  onClose,
}: {
  resumen: ResumenCobroEmpresa | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!resumen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de cobro</DialogTitle>
          <DialogDescription>
            {resumen?.empresa?.nombre} · {resumen && periodoLabel(resumen.periodo)}
          </DialogDescription>
        </DialogHeader>
        {resumen && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface/80 p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">NIT</p>
                <p className="font-medium tabular mt-0.5">{resumen.empresa?.nit}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Administrador</p>
                <p className="font-medium mt-0.5">{resumen.empresa?.adminNombre}</p>
                <p className="text-xs text-muted-foreground truncate">{resumen.empresa?.adminEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monto pagado</p>
                <p className="font-semibold tabular mt-0.5">{formatCOP(resumen.montoPagado)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total a cobrar</p>
                <p
                  className={cn(
                    "font-semibold tabular mt-0.5",
                    resumen.cuentaCobro?.estado === "verificada"
                      ? "text-success"
                      : "text-primary",
                  )}
                >
                  {formatCOP(
                    resumen.cuentaCobro?.estado === "verificada"
                      ? 0
                      : resumen.montoTotalCobrar,
                  )}
                </p>
                {resumen.cuentaCobro?.estado === "evidencia_enviada" && (
                  <p className="text-[10px] text-warning mt-0.5">
                    Evidencia recibida — verifica el pago para saldar la cuenta
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Adelantos incluidos ({resumen.cantidadAdelantos})</h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {resumen.adelantosPagados.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.empleadoNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.numeroCuotas} cuota(s) en nómina
                        {resumen.cuentaCobro?.estado === "verificada"
                          ? " · cobro saldado"
                          : " · pendiente de cobro a empresa"}
                      </p>
                    </div>
                    <span className="tabular font-medium shrink-0">{formatCOP(a.monto)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {resumen.cuentaCobro && (
              <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
                <p className="font-semibold">Cuenta de cobro</p>
                <p className="text-muted-foreground">
                  Estado:{" "}
                  <span className="font-medium text-foreground">
                    {estadoCuentaCobroLabel[resumen.cuentaCobro.estado]}
                  </span>
                </p>
                {resumen.cuentaCobro.documentoCobroNombre && (
                  <p className="flex items-center gap-2">
                    <FileText className="size-4 text-primary shrink-0" />
                    {resumen.cuentaCobro.documentoCobroNombre}
                  </p>
                )}
                {resumen.cuentaCobro.evidenciaPagoNombre && (
                  <p className="flex items-center gap-2">
                    <Upload className="size-4 text-success shrink-0" />
                    Evidencia: {resumen.cuentaCobro.evidenciaPagoNombre}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AdjuntarCuentaDialog({
  resumen,
  onClose,
  onPublicar,
}: {
  resumen: ResumenCobroEmpresa | null;
  onClose: () => void;
  onPublicar: (resumen: ResumenCobroEmpresa, nombreArchivo: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  const handleOpen = (open: boolean) => {
    if (!open) {
      setFile(null);
      onClose();
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumen || !file) return;
    onPublicar(resumen, file.name);
    setFile(null);
  };

  return (
    <Dialog open={!!resumen} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjuntar cuenta de cobro</DialogTitle>
          <DialogDescription>
            El documento quedará visible para la empresa en su panel para que realice el pago.
          </DialogDescription>
        </DialogHeader>
        {resumen && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-xl bg-surface border border-border p-4 text-sm">
              <p className="font-semibold">{resumen.empresa?.nombre}</p>
              <p className="text-primary font-bold tabular mt-1">
                Total a cobrar: {formatCOP(resumen.montoTotalCobrar)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-cobro">Documento (PDF o imagen)</Label>
              <Input
                id="doc-cobro"
                type="file"
                accept="image/*,application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!file}>
                <Upload className="size-4" />
                Publicar cuenta
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RevisarEvidenciaDialog({
  resumen,
  onClose,
  onVerificar,
  onRechazar,
  onSimularEvidencia,
}: {
  resumen: ResumenCobroEmpresa | null;
  onClose: () => void;
  onVerificar: (cuentaId: string) => void;
  onRechazar: (cuentaId: string, nota: string) => void;
  onSimularEvidencia: (cuentaId: string, nombre: string) => void;
}) {
  const [nota, setNota] = useState("");
  const cuenta = resumen?.cuentaCobro;

  const handleOpen = (open: boolean) => {
    if (!open) {
      setNota("");
      onClose();
    }
  };

  return (
    <Dialog open={!!resumen} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revisar evidencia de pago</DialogTitle>
          <DialogDescription>
            Confirma que la empresa realizó el pago. Al verificar, se activan las cuotas de los empleados.
          </DialogDescription>
        </DialogHeader>
        {resumen && cuenta && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4 space-y-2 text-sm">
              <p className="font-semibold">{resumen.empresa?.nombre}</p>
              <p className="tabular text-primary font-bold">{formatCOP(resumen.montoTotalCobrar)}</p>
              {cuenta.evidenciaPagoNombre ? (
                <p className="flex items-center gap-2 text-success">
                  <FileText className="size-4 shrink-0" />
                  {cuenta.evidenciaPagoNombre}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">Sin evidencia adjunta aún.</p>
              )}
            </div>

            {cuenta.estado === "emitida" && (
              <div className="rounded-lg border border-dashed border-warning/40 bg-warning/5 p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Demo: simula que la empresa subió evidencia desde su panel.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onSimularEvidencia(cuenta.id, "comprobante-empresa-demo.pdf")}
                >
                  Simular evidencia empresa
                </Button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nota-rechazo">Nota (solo si rechazas)</Label>
              <Textarea
                id="nota-rechazo"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Motivo del rechazo de la evidencia…"
                rows={3}
                className="resize-none"
              />
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={nota.trim().length < 5}
                onClick={() => onRechazar(cuenta.id, nota)}
              >
                <XCircle className="size-4" />
                Rechazar
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                disabled={cuenta.estado !== "evidencia_enviada"}
                onClick={() => onVerificar(cuenta.id)}
              >
                <CheckCircle2 className="size-4" />
                Verificar pago
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EstadoCuotaBadge({ estado }: { estado: FilaDetalleCuota["estado"] }) {
  const config = {
    a_informar: {
      label: "A informar",
      className: "bg-info/15 text-info border-info/30",
    },
    cobro_saldado: {
      label: "Cobro saldado",
      className: "bg-success/15 text-success border-success/30",
    },
  }[estado];

  return (
    <span
      className={cn(
        "inline-flex text-xs font-medium rounded-md border px-2 py-0.5 whitespace-nowrap",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function DetalleCuotasDialog({
  resumen,
  adelantos,
  empleados,
  valorComision,
  onClose,
}: {
  resumen: ResumenCobroEmpresa | null;
  adelantos: Adelanto[];
  empleados: Empleado[];
  valorComision: string;
  onClose: () => void;
}) {
  const adelantosActualizados = useMemo(() => {
    if (!resumen) return [];
    return resumen.adelantosPagados.map((a) => adelantos.find((x) => x.id === a.id) ?? a);
  }, [resumen, adelantos]);

  const resumenActualizado = useMemo(
    () => (resumen ? { ...resumen, adelantosPagados: adelantosActualizados } : null),
    [resumen, adelantosActualizados],
  );

  const filas = useMemo(
    () => (resumenActualizado ? buildFilasDetalleCuotas(resumenActualizado, valorComision) : []),
    [resumenActualizado, valorComision],
  );

  const saldos = useMemo(
    () =>
      resumenActualizado
        ? buildResumenSaldosEmpresa(resumenActualizado, empleados, adelantos, valorComision)
        : [],
    [resumenActualizado, empleados, adelantos, valorComision],
  );

  const cuotasEnEstaCuenta = filas.length;
  const cuotasNomina = useMemo(
    () =>
      resumenActualizado
        ? sumarCuotasNominaInformadas(resumenActualizado.adelantosPagados, valorComision)
        : 0,
    [resumenActualizado, valorComision],
  );

  return (
    <Dialog open={!!resumen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex w-[calc(100%-1.5rem)] max-h-[min(90dvh,calc(100vh-1.5rem))] flex-col gap-0 overflow-hidden p-4 sm:max-w-4xl sm:p-6 min-w-0">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>Detalle de cuotas y saldos</DialogTitle>
          <DialogDescription>
            {resumen?.empresa?.nombre} · {resumen && periodoLabel(resumen.periodo)} — datos para que
            la empresa descuente en nómina y saldo disponible por empleado.
          </DialogDescription>
        </DialogHeader>

        {resumen && (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-1 -mr-1">
            <p className="text-xs text-muted-foreground rounded-lg border border-border bg-surface/50 px-3 py-2.5">
              La empresa paga el <strong>adelanto completo</strong> en una sola cuenta. El saldo solo
              pasa a <strong>$0</strong> cuando el super admin <strong>verifica la evidencia de pago</strong>.
              Hasta entonces el total a cobrar se mantiene pendiente.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-surface/60 p-3">
                <p className="text-xs text-muted-foreground">Adelantos</p>
                <p className="text-lg font-bold tabular text-primary mt-0.5">{cuotasEnEstaCuenta}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">en esta cuenta</p>
              </div>
              <div className="rounded-lg border border-border bg-surface/60 p-3">
                <p className="text-xs text-muted-foreground">Cuotas en nómina</p>
                <p className="text-lg font-bold tabular text-warning mt-0.5">{cuotasNomina}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">meses a descontar (total)</p>
              </div>
              <div className="rounded-lg border border-border bg-surface/60 p-3 col-span-2">
                <p className="text-xs text-muted-foreground">Estado cuenta de cobro</p>
                <p className="text-sm font-semibold mt-1">
                  {resumen.cuentaCobro
                    ? estadoCuentaCobroLabel[resumen.cuentaCobro.estado]
                    : "Sin cuenta emitida"}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold mb-1">Detalle por empleado</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Comisión: {formatCOP(Number(valorComision) || 0)} por cuota · se multiplica por el
                número de cuotas del adelanto.
              </p>
              <p className="text-[10px] text-muted-foreground mb-2 sm:hidden">
                Desliza horizontalmente para ver todas las columnas.
              </p>
              <div className="admin-table-scroll w-full rounded-xl border border-border">
                <table className="admin-table w-max min-w-full sm:min-w-[52rem]">
                  <thead className="admin-table-head">
                    <tr>
                      <th className="admin-table-th text-left whitespace-nowrap">Empleado</th>
                      <th className="admin-table-th text-left whitespace-nowrap">Fecha solicitud</th>
                      <th className="admin-table-th text-center whitespace-nowrap">Cuotas</th>
                      <th className="admin-table-th text-right whitespace-nowrap">Valor solicitado</th>
                      <th className="admin-table-th text-right whitespace-nowrap">Monto a recibir</th>
                      <th className="admin-table-th text-right whitespace-nowrap">Descuento nómina</th>
                      <th className="admin-table-th text-left whitespace-nowrap">Inicio descuento</th>
                      <th className="admin-table-th text-center whitespace-nowrap">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filas.map((f) => (
                      <tr key={f.adelantoId} className="hover:bg-muted/20 align-top">
                        <td className="whitespace-nowrap">
                          <div className="admin-table-cell-title text-sm">{f.empleadoNombre}</div>
                          <div className="admin-table-cell-note tabular">CC {f.empleadoCedula}</div>
                        </td>
                        <td className="text-sm text-muted-foreground tabular whitespace-nowrap">
                          {formatFechaSolicitud(f.fechaSolicitud)}
                        </td>
                        <td className="text-center tabular font-semibold whitespace-nowrap">
                          {f.totalCuotas}
                        </td>
                        <td className="text-right admin-table-cell-money tabular whitespace-nowrap">
                          {formatCOP(f.montoSolicitado)}
                        </td>
                        <td className="text-right admin-table-cell-money tabular text-success font-medium whitespace-nowrap">
                          {formatCOP(f.montoARecibir)}
                        </td>
                        <td className="text-right admin-table-cell-money tabular text-muted-foreground whitespace-nowrap">
                          {formatCOP(f.valorDescuentoNomina)}
                          {f.totalCuotas > 1 && (
                            <span className="text-[10px] font-normal"> / mes</span>
                          )}
                        </td>
                        <td className="text-sm text-muted-foreground tabular whitespace-nowrap">
                          {formatPeriodoDescuento(f.periodoInicioDescuento)}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <EstadoCuotaBadge estado={f.estado} />
                        </td>
                      </tr>
                    ))}
                    {filas.length === 0 && (
                      <tr>
                        <td colSpan={8} className="admin-table-empty py-6">
                          No hay adelantos en esta cuenta de cobro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Saldo disponible por adelanto</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Referencia para nuevos adelantos: 30% del salario menos lo que la empresa aún debe
                descontar al empleado en nómina (no es deuda pendiente con la plataforma).
              </p>
              <div className="space-y-2">
                {saldos.map((s) => (
                  <div
                    key={s.empleadoCedula}
                    className="rounded-xl border border-border bg-surface/50 p-3 sm:p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{s.empleadoNombre}</p>
                        <p className="text-xs text-muted-foreground tabular">
                          CC {s.empleadoCedula} · {s.cuotasDescontadas} descontada(s) ·{" "}
                          {s.cuotasPendientes} pendiente(s)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Saldo disponible</p>
                        <p className="text-lg font-bold tabular text-primary">
                          {formatCOP(s.saldoDisponible)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Tope base (30%)</span>
                        <p className="font-medium tabular">{formatCOP(s.saldoBase)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Comprometido (cuotas pend.)</span>
                        <p className="font-medium tabular text-warning">{formatCOP(s.comprometido)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
