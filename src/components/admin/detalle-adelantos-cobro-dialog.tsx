import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCOP } from "@/lib/admin-store";
import { getReferenciaNomina } from "@/lib/api/admin";
import type { ReferenciaNominaApi, ControlPagoEmpresaApi } from "@/lib/api/types";
import { exportReferenciaNominaExcel } from "@/lib/export-referencia-nomina-excel";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  Layers,
  Loader2,
  ReceiptText,
  Search,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";

interface DetalleAdelantosCobroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: ControlPagoEmpresaApi | null;
  periodo: string; // "YYYY-MM"
  periodoLabel?: string;
}

export function DetalleAdelantosCobroDialog({
  open,
  onOpenChange,
  empresa,
  periodo,
  periodoLabel,
}: DetalleAdelantosCobroDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReferenciaNominaApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<"detalle" | "resumen">("detalle");

  useEffect(() => {
    if (!open || !empresa) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getReferenciaNomina({
      empresa_id: empresa.empresa_id,
      periodo,
    })
      .then((res) => {
        if (!isMounted) return;
        setData(res);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg =
          (err as { message?: string })?.message ||
          "No se pudieron cargar los detalles de adelantos para este periodo.";
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, empresa, periodo]);

  const detallesFiltrados = useMemo(() => {
    if (!data?.detalle) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return data.detalle;
    return data.detalle.filter(
      (d) =>
        `${d.nombre} ${d.apellido}`.toLowerCase().includes(q) ||
        d.numero_documento.toLowerCase().includes(q) ||
        d.solicitud_id.toLowerCase().includes(q),
    );
  }, [data?.detalle, busqueda]);

  const resumenFiltrado = useMemo(() => {
    if (!data?.resumen) return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return data.resumen;
    return data.resumen.filter(
      (r) =>
        `${r.nombre} ${r.apellido}`.toLowerCase().includes(q) ||
        r.numero_documento.toLowerCase().includes(q),
    );
  }, [data?.resumen, busqueda]);

  const handleExportExcel = () => {
    if (data) {
      exportReferenciaNominaExcel(data);
    }
  };

  if (!open || !empresa) {
    return null;
  }

  const totales = data?.totales;
  const totalDescontar = Number(totales?.total_a_descontar_mes || data?.total_a_descontar || empresa.total_a_cobrar) || 0;
  const totalSolicitado = Number(totales?.total_solicitado || empresa.total_pagado) || 0;
  const totalCuotas = totales?.total_cuotas || data?.detalle?.length || 0;
  const totalEmpleados = data?.resumen?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-3xl border bg-background shadow-2xl">
        {/* HEADER */}
        <div className="p-6 border-b bg-gradient-to-br from-blue-500/10 via-background to-indigo-500/5 dark:from-blue-950/30 dark:via-background dark:to-indigo-950/20 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white grid place-items-center shadow-lg shadow-blue-600/25 shrink-0">
                <ReceiptText className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Adelantos y Cuotas a Cobrar
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/50">
                    {periodoLabel || periodo}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Desglose de descuentos de nómina y cuotas de adelantos activas en este periodo.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* DATOS DE LA EMPRESA */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Building2 className="size-4 text-primary shrink-0" />
              <span className="font-semibold">{empresa.empresa_nombre}</span>
              {empresa.empresa_nit && (
                <span className="text-muted-foreground font-mono font-normal">
                  (NIT: {empresa.empresa_nit})
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="size-3.5" />
                Periodo de corte: {periodoLabel || periodo}
              </span>
            </div>
          </div>
        </div>

        {/* MÉTRICAS KPI */}
        <div className="p-6 pb-3 space-y-4 shrink-0 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl border border-primary/20 bg-primary/5">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Wallet className="size-3 text-primary" /> Total a cobrar este mes
              </p>
              <p className="text-lg font-bold text-primary mt-0.5 font-mono">
                {formatCOP(totalDescontar)}
              </p>
            </div>

            <div className="p-3 rounded-2xl border border-border/80 bg-muted/30">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Coins className="size-3 text-emerald-600" /> Total solicitado
              </p>
              <p className="text-lg font-bold text-foreground mt-0.5 font-mono">
                {formatCOP(totalSolicitado)}
              </p>
            </div>

            <div className="p-3 rounded-2xl border border-border/80 bg-muted/30">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Users className="size-3 text-blue-600" /> Empleados
              </p>
              <p className="text-lg font-bold text-foreground mt-0.5 font-mono">
                {totalEmpleados}
              </p>
            </div>

            <div className="p-3 rounded-2xl border border-border/80 bg-muted/30">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Layers className="size-3 text-purple-600" /> Cuotas en periodo
              </p>
              <p className="text-lg font-bold text-foreground mt-0.5 font-mono">
                {totalCuotas}
              </p>
            </div>
          </div>

          {/* CONTROLES: VISTA (DETALLE VS RESUMEN) Y BUSCADOR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setVista("detalle")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  vista === "detalle"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Por cuota individual ({data?.detalle?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setVista("resumen")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  vista === "resumen"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Consolidado por empleado ({data?.resumen?.length || 0})
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar empleado o documento..."
                  className="h-9 pl-9 pr-8 text-xs rounded-xl border-border/80"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {data && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleExportExcel}
                  className="h-9 text-xs rounded-xl border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shrink-0 gap-1.5 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  title="Descargar Excel con el detalle completo"
                >
                  <FileSpreadsheet className="size-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Excel nómina</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE ADELANTOS / CUOTAS */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground text-xs">
              <Loader2 className="size-6 animate-spin text-primary" />
              Cargando detalle de adelantos a cobrar…
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center text-xs text-destructive">
              {error}
            </div>
          ) : vista === "detalle" ? (
            <div className="rounded-2xl border border-border/80 overflow-hidden">
              <table className="admin-table w-full text-xs">
                <thead className="admin-table-head sticky top-0 z-10">
                  <tr>
                    <th className="admin-table-th text-left">Empleado</th>
                    <th className="admin-table-th text-left hidden sm:table-cell">Documento</th>
                    <th className="admin-table-th text-center">Cuota a cobrar</th>
                    <th className="admin-table-th text-right">Monto Adelanto</th>
                    <th className="admin-table-th text-right">Descuento este mes</th>
                    <th className="admin-table-th text-right hidden md:table-cell">Tarifa fija</th>
                    <th className="admin-table-th text-center">Estado cuota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {detallesFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground text-xs">
                        {data?.detalle?.length === 0
                          ? "No se registran adelantos ni cuotas pendientes de cobro para esta empresa en este periodo."
                          : `Sin coincidencias para "${busqueda}"`}
                      </td>
                    </tr>
                  ) : (
                    detallesFiltrados.map((d, idx) => (
                      <tr key={`${d.solicitud_id}-${d.cuota_numero}-${idx}`} className="hover:bg-muted/30">
                        <td className="admin-table-cell-title">
                          <div className="flex items-center gap-2">
                            <User className="size-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-foreground">
                              {d.nombre} {d.apellido}
                            </span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell tabular font-mono text-muted-foreground">
                          {d.numero_documento}
                        </td>
                        <td className="text-center">
                          <span className="inline-flex px-2.5 py-0.5 rounded-md font-semibold text-[11px] bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60">
                            Cuota {d.cuota_numero} de {d.total_cuotas}
                          </span>
                        </td>
                        <td className="text-right tabular font-mono">
                          {formatCOP(Number(d.monto_solicitud) || 0)}
                        </td>
                        <td className="text-right tabular font-bold text-primary font-mono">
                          {formatCOP(Number(d.monto_a_descontar) || 0)}
                        </td>
                        <td className="text-right tabular font-mono text-muted-foreground hidden md:table-cell">
                          {formatCOP(Number(d.tarifa_cuota) || 0)}
                        </td>
                        <td className="text-center">
                          {d.estado_cuota === "pagada" || d.estado_cuota === "descontada" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                              <CheckCircle2 className="size-3 text-emerald-600" /> Pagada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 overflow-hidden">
              <table className="admin-table w-full text-xs">
                <thead className="admin-table-head sticky top-0 z-10">
                  <tr>
                    <th className="admin-table-th text-left">Empleado</th>
                    <th className="admin-table-th text-left hidden sm:table-cell">Documento</th>
                    <th className="admin-table-th text-center">Adelantos activos</th>
                    <th className="admin-table-th text-center">Cuotas</th>
                    <th className="admin-table-th text-right">Total solicitado</th>
                    <th className="admin-table-th text-right">Neto transferido</th>
                    <th className="admin-table-th text-right">Total a descontar mes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {resumenFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground text-xs">
                        {data?.resumen?.length === 0
                          ? "No hay empleados con descuentos registrados en este periodo."
                          : `Sin coincidencias para "${busqueda}"`}
                      </td>
                    </tr>
                  ) : (
                    resumenFiltrado.map((r, idx) => (
                      <tr key={`${r.numero_documento}-${idx}`} className="hover:bg-muted/30">
                        <td className="admin-table-cell-title font-semibold text-foreground">
                          {r.nombre} {r.apellido}
                        </td>
                        <td className="hidden sm:table-cell tabular font-mono text-muted-foreground">
                          {r.numero_documento}
                        </td>
                        <td className="text-center tabular font-medium">
                          {r.cantidad_adelantos}
                        </td>
                        <td className="text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-semibold">
                            {r.detalle_cuotas || r.total_cuotas}
                          </span>
                        </td>
                        <td className="text-right tabular font-mono">
                          {formatCOP(Number(r.total_solicitado) || 0)}
                        </td>
                        <td className="text-right tabular font-mono text-muted-foreground">
                          {formatCOP(Number(r.total_neto_transferido) || 0)}
                        </td>
                        <td className="text-right tabular font-bold text-primary font-mono">
                          {formatCOP(Number(r.total_a_descontar_mes) || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {vista === "detalle" ? `${detallesFiltrados.length} cuota(s)` : `${resumenFiltrado.length} empleado(s)`} en {periodoLabel || periodo}
          </p>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-6 font-semibold"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
