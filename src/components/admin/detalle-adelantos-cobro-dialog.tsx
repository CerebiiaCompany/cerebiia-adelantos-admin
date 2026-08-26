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
  Clock,
  Coins,
  FileSpreadsheet,
  Layers,
  Loader2,
  ReceiptText,
  Search,
  User,
  Users,
  Wallet,
  X,
  CreditCard,
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

  // Total a cobrar este mes: solo suma las cuotas que están pendientes de cobro
  const totalPendienteCobrar = useMemo(() => {
    if (data?.detalle && data.detalle.length > 0) {
      return data.detalle
        .filter((d) => d.estado_cuota === "pendiente")
        .reduce((sum, d) => sum + (Number(d.monto_a_descontar) || 0), 0);
    }
    return Number(empresa?.total_a_cobrar) || 0;
  }, [data?.detalle, empresa?.total_a_cobrar]);

  // Mapa de montos pendientes por empleado en el resumen
  const pendientesPorEmpleado = useMemo(() => {
    const map = new Map<string, number>();
    if (data?.detalle) {
      for (const d of data.detalle) {
        if (d.estado_cuota === "pendiente") {
          map.set(
            d.numero_documento,
            (map.get(d.numero_documento) || 0) + (Number(d.monto_a_descontar) || 0),
          );
        }
      }
    }
    return map;
  }, [data?.detalle]);

  const handleExportExcel = () => {
    if (data) {
      exportReferenciaNominaExcel(data);
    }
  };

  if (!open || !empresa) {
    return null;
  }

  const totales = data?.totales;
  const totalSolicitado = Number(totales?.total_solicitado || empresa.total_pagado) || 0;
  const totalCuotas = totales?.total_cuotas || data?.detalle?.length || 0;
  const totalEmpleados = data?.resumen?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl xl:max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-3xl border bg-background shadow-2xl">
        {/* HEADER */}
        <div className="p-6 border-b bg-gradient-to-br from-indigo-500/10 via-background to-purple-500/5 dark:from-indigo-950/30 dark:via-background dark:to-purple-950/20 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white grid place-items-center shadow-lg shadow-indigo-600/25 shrink-0">
                <ReceiptText className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Adelantos y Cuotas a Cobrar
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/50">
                    {periodoLabel || periodo}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Desglose de nómina, cuotas amortizadas y saldos activos para la empresa en este periodo.
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
                <Calendar className="size-3.5 text-primary/70" />
                Periodo de corte: <strong>{periodoLabel || periodo}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* MÉTRICAS KPI & CONTROLES */}
        <div className="p-6 pb-3 space-y-4 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border border-primary/25 bg-primary/5 shadow-xs">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Wallet className="size-3.5 text-primary" /> Total a cobrar este mes
              </p>
              <p className="text-lg sm:text-xl font-normal text-primary mt-1 font-mono tracking-tight">
                {formatCOP(totalPendienteCobrar)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 shadow-xs">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Coins className="size-3.5 text-emerald-600" /> Total solicitado
              </p>
              <p className="text-lg sm:text-xl font-normal text-foreground mt-1 font-mono tracking-tight">
                {formatCOP(totalSolicitado)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 shadow-xs">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3.5 text-blue-600" /> Empleados
              </p>
              <p className="text-lg sm:text-xl font-normal text-foreground mt-1 font-mono tracking-tight">
                {totalEmpleados}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 shadow-xs">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-purple-600" /> Cuotas en periodo
              </p>
              <p className="text-lg sm:text-xl font-normal text-foreground mt-1 font-mono tracking-tight">
                {totalCuotas}
              </p>
            </div>
          </div>

          {/* CONTROLES: VISTA (DETALLE VS RESUMEN) Y BUSCADOR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="inline-flex items-center p-1 rounded-xl bg-muted/70 border border-border/60">
              <button
                type="button"
                onClick={() => setVista("detalle")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  vista === "resumen"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Consolidado por empleado ({data?.resumen?.length || 0})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar empleado o documento..."
                  className="h-9 pl-9 pr-8 text-xs rounded-xl border-border/80 shadow-xs"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
                  className="h-9 text-xs rounded-xl border-emerald-300 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100 shrink-0 gap-1.5 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-xs font-medium cursor-pointer"
                  title="Descargar Excel con el detalle completo"
                >
                  <FileSpreadsheet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Excel nómina</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE ADELANTOS / CUOTAS CON SCROLL HORIZONTAL Y VERTICAL */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground text-xs">
              <Loader2 className="size-7 animate-spin text-primary" />
              <span>Cargando desglose de adelantos y cuotas…</span>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-center text-xs text-destructive">
              {error}
            </div>
          ) : vista === "detalle" ? (
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
              <div className="admin-table-scroll">
                <table className="admin-table min-w-[54rem] w-full text-xs">
                  <thead className="admin-table-head sticky top-0 z-10">
                    <tr>
                      <th className="admin-table-th text-left font-medium">Empleado</th>
                      <th className="admin-table-th text-left font-medium">Documento</th>
                      <th className="admin-table-th text-center font-medium">Cuotas pagadas</th>
                      <th className="admin-table-th text-right font-medium">Monto total adelanto</th>
                      <th className="admin-table-th text-right font-medium">Descuento este mes</th>
                      <th className="admin-table-th text-right font-medium">Tarifa fija</th>
                      <th className="admin-table-th text-center font-medium">Estado cuota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {detallesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                          {data?.detalle?.length === 0
                            ? "No se registran cuotas pendientes ni adelantos activos para este periodo."
                            : `Sin resultados para "${busqueda}"`}
                        </td>
                      </tr>
                    ) : (
                      detallesFiltrados.map((d, idx) => {
                        const isPagada =
                          d.estado_cuota === "pagada" || d.estado_cuota === "descontada";
                        
                        // Si la cuota de este periodo ya fue liberada/pagada, se han pagado `d.cuota_numero` cuotas.
                        // Si está pendiente, se han pagado las cuotas anteriores (d.cuota_numero - 1).
                        const cuotasPagadasCount = isPagada
                          ? d.cuota_numero
                          : Math.max(0, d.cuota_numero - 1);
                        
                        const pctPagado = Math.min(
                          100,
                          Math.max(0, Math.round((cuotasPagadasCount / d.total_cuotas) * 100)),
                        );

                        return (
                          <tr
                            key={`${d.solicitud_id}-${d.cuota_numero}-${idx}`}
                            className="hover:bg-muted/40 transition-colors"
                          >
                            <td className="admin-table-cell-title">
                              <div className="flex items-center gap-2.5">
                                <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                                  <User className="size-3.5" />
                                </div>
                                <span className="font-medium text-foreground">
                                  {d.nombre} {d.apellido}
                                </span>
                              </div>
                            </td>
                            <td className="tabular font-mono text-muted-foreground font-normal">
                              {d.numero_documento}
                            </td>
                            <td className="text-center">
                              {/* BARRA DE PROGRESO DE CUOTAS PAGADAS */}
                              <div className="flex flex-col items-center justify-center min-w-[5.5rem] max-w-[7.5rem] mx-auto py-1">
                                <span className="text-xs font-normal text-foreground">
                                  {cuotasPagadasCount} de {d.total_cuotas}
                                </span>
                                <div className="w-full bg-muted/90 dark:bg-muted/50 rounded-full h-1.5 mt-1 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      pctPagado === 100
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                                        : pctPagado > 0
                                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
                                          : "bg-transparent"
                                    }`}
                                    style={{ width: `${pctPagado}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-[10px] mt-1 font-normal tracking-tight ${
                                    pctPagado === 100
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : pctPagado > 0
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  {pctPagado === 100
                                    ? "100% saldado"
                                    : pctPagado > 0
                                      ? `${pctPagado}% saldado`
                                      : "0% saldado (Pendiente)"}
                                </span>
                              </div>
                            </td>
                            <td className="text-right tabular font-mono text-foreground font-normal">
                              {formatCOP(Number(d.monto_solicitud) || 0)}
                            </td>
                            <td className="text-right tabular font-mono font-normal">
                              {isPagada ? (
                                <span className="text-muted-foreground/60">
                                  {formatCOP(0)}
                                </span>
                              ) : (
                                <span className="text-primary">
                                  {formatCOP(Number(d.monto_a_descontar) || 0)}
                                </span>
                              )}
                            </td>
                            <td className="text-right tabular font-mono text-muted-foreground font-normal">
                              {formatCOP(Number(d.tarifa_cuota) || 0)}
                            </td>
                            <td className="text-center">
                              {isPagada ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 shadow-xs">
                                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" /> Pagada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-100/90 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60 shadow-xs">
                                  <Clock className="size-3 text-amber-600 dark:text-amber-400" /> Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
              <div className="admin-table-scroll">
                <table className="admin-table min-w-[50rem] w-full text-xs">
                  <thead className="admin-table-head sticky top-0 z-10">
                    <tr>
                      <th className="admin-table-th text-left font-medium">Empleado</th>
                      <th className="admin-table-th text-left font-medium">Documento</th>
                      <th className="admin-table-th text-center font-medium">Adelantos activos</th>
                      <th className="admin-table-th text-center font-medium">Desglose cuotas</th>
                      <th className="admin-table-th text-right font-medium">Total solicitado</th>
                      <th className="admin-table-th text-right font-medium">Neto transferido</th>
                      <th className="admin-table-th text-right font-medium">Total a descontar mes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {resumenFiltrado.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                          {data?.resumen?.length === 0
                            ? "No hay empleados con descuentos registrados en este periodo."
                            : `Sin resultados para "${busqueda}"`}
                        </td>
                      </tr>
                    ) : (
                      resumenFiltrado.map((r, idx) => {
                        const pendienteEmp = pendientesPorEmpleado.get(r.numero_documento) || 0;
                        return (
                          <tr key={`${r.numero_documento}-${idx}`} className="hover:bg-muted/40 transition-colors">
                            <td className="admin-table-cell-title">
                              <div className="flex items-center gap-2.5">
                                <div className="size-7 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                                  <User className="size-3.5" />
                                </div>
                                <span className="font-medium text-foreground">
                                  {r.nombre} {r.apellido}
                                </span>
                              </div>
                            </td>
                            <td className="tabular font-mono text-muted-foreground font-normal">
                              {r.numero_documento}
                            </td>
                            <td className="text-center tabular font-normal text-foreground">
                              {r.cantidad_adelantos}
                            </td>
                            <td className="text-center font-mono">
                              <span className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-normal border border-border/60">
                                {r.detalle_cuotas || r.total_cuotas}
                              </span>
                            </td>
                            <td className="text-right tabular font-mono text-foreground font-normal">
                              {formatCOP(Number(r.total_solicitado) || 0)}
                            </td>
                            <td className="text-right tabular font-mono text-muted-foreground font-normal">
                              {formatCOP(Number(r.total_neto_transferido) || 0)}
                            </td>
                            <td className="text-right tabular font-mono font-normal">
                              {pendienteEmp > 0 ? (
                                <span className="text-primary">
                                  {formatCOP(pendienteEmp)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">
                                  {formatCOP(0)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 px-6 border-t bg-muted/20 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {vista === "detalle"
              ? `${detallesFiltrados.length} cuota(s) registradas`
              : `${resumenFiltrado.length} empleado(s) consolidados`}{" "}
            en <strong>{periodoLabel || periodo}</strong>
          </p>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-6 font-semibold shadow-xs cursor-pointer"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
