import React, { useState, useMemo } from "react";
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
import type { LiberarCuotasResponse } from "@/lib/api/types";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  Download,
  FileSpreadsheet,
  Search,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";

interface InformeCuotasLiberadasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  informe: LiberarCuotasResponse | null;
  empresaNombre?: string;
  empresaNit?: string;
  periodoLabel?: string;
}

export function InformeCuotasLiberadasDialog({
  open,
  onOpenChange,
  informe,
  empresaNombre,
  empresaNit,
  periodoLabel,
}: InformeCuotasLiberadasDialogProps) {
  const [busqueda, setBusqueda] = useState("");

  const totalMonto = Number(informe?.monto_total_liberado) || 0;
  const detalles = informe?.detalles || [];

  const detallesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return detalles;
    return detalles.filter(
      (d) =>
        d.empleado_nombre?.toLowerCase().includes(q) ||
        d.empleado_documento?.toLowerCase().includes(q) ||
        d.adelanto_id?.toLowerCase().includes(q),
    );
  }, [detalles, busqueda]);

  const handleExportCSV = () => {
    if (detalles.length === 0) return;

    const headers = [
      "Empleado",
      "Documento / Cedula",
      "ID Adelanto",
      "No. Cuota",
      "Monto Liberado",
      "Nuevo Saldo Disponible",
    ];

    const rows = detalles.map((d) => [
      `"${d.empleado_nombre || "Empleado"}"`,
      `"${d.empleado_documento || "—"}"`,
      `"${d.adelanto_id || "—"}"`,
      `"Cuota ${d.numero_cuota}"`,
      `"${Number(d.monto_cuota || 0)}"`,
      `"${d.nuevo_saldo_disponible !== undefined ? Number(d.nuevo_saldo_disponible) : "—"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `informe_cuotas_liberadas_${empresaNombre || "empresa"}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!open || !informe) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border bg-background shadow-2xl">
        {/* HEADER */}
        <div className="p-6 border-b bg-gradient-to-br from-emerald-500/15 via-background to-blue-500/10 dark:from-emerald-950/40 dark:via-background dark:to-blue-950/20 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white grid place-items-center shadow-lg shadow-emerald-600/25 shrink-0">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Informe de Cuotas Liberadas y Reintegro de Saldos
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Verificación de amortizaciones y actualización de cupo disponible por empleado.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* DATOS DE LA EMPRESA & PERIODO */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Building2 className="size-4 text-primary shrink-0" />
              <span>{informe.empresa_nombre || empresaNombre}</span>
              {empresaNit && (
                <span className="text-muted-foreground font-mono font-normal">
                  (NIT: {empresaNit})
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {periodoLabel || informe.periodo || "Periodo actual"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] border border-emerald-300/40">
                <CheckCircle2 className="size-3" /> Saldado con éxito
              </span>
            </div>
          </div>
        </div>

        {/* MÉTRICAS KPI DE LA LIBERACIÓN */}
        <div className="p-6 pb-2 space-y-4 shrink-0 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                <Coins className="size-4 text-emerald-600 dark:text-emerald-400" />
                Total monto liberado
              </div>
              <p className="text-xl font-bold text-emerald-950 dark:text-emerald-200 mt-1 font-mono">
                {formatCOP(totalMonto)}
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Reintegrado a cupos disponibles
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-blue-200/80 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-300">
                <Users className="size-4 text-blue-600 dark:text-blue-400" />
                Empleados beneficiados
              </div>
              <p className="text-xl font-bold text-blue-950 dark:text-blue-200 mt-1 font-mono">
                {informe.empleados_actualizados || detalles.length}
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                Saldos recalculados en BD
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-purple-200/80 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-900 dark:text-purple-300">
                <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
                Cuotas amortizadas
              </div>
              <p className="text-xl font-bold text-purple-950 dark:text-purple-200 mt-1 font-mono">
                {informe.cuotas_liberadas || detalles.length}
              </p>
              <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                Marcadas como pagadas
              </p>
            </div>
          </div>

          {/* BUSCADOR DE DETALLES */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por empleado, cédula o ID adelanto..."
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

            {detalles.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="h-9 text-xs rounded-xl shrink-0 gap-1.5 border-border/80"
              >
                <Download className="size-3.5 text-muted-foreground" />
                Exportar CSV
              </Button>
            )}
          </div>
        </div>

        {/* TABLA DE AUDITORÍA Y COMPROBACIÓN */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
          <div className="rounded-2xl border border-border/80 overflow-hidden">
            <table className="admin-table w-full text-xs">
              <thead className="admin-table-head sticky top-0 z-10">
                <tr>
                  <th className="admin-table-th text-left">Empleado</th>
                  <th className="admin-table-th text-left hidden sm:table-cell">Documento</th>
                  <th className="admin-table-th text-center">Cuota</th>
                  <th className="admin-table-th text-right">Monto Liberado</th>
                  <th className="admin-table-th text-right">Nuevo Saldo Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {detallesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                      {detalles.length === 0
                        ? "No se retornaron detalles individuales en la respuesta del backend."
                        : `Sin coincidencias para "${busqueda}"`}
                    </td>
                  </tr>
                ) : (
                  detallesFiltrados.map((item, idx) => (
                    <tr key={`${item.adelanto_id || item.empleado_id}-${idx}`} className="hover:bg-muted/30">
                      <td className="admin-table-cell-title">
                        <div className="flex items-center gap-2">
                          <UserCheck className="size-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-foreground">
                            {item.empleado_nombre || "Empleado"}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell tabular font-mono text-muted-foreground">
                        {item.empleado_documento || "—"}
                      </td>
                      <td className="text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-md font-semibold text-[11px] bg-muted border border-border/60">
                          Cuota {item.numero_cuota}
                          {item.total_cuotas ? ` de ${item.total_cuotas}` : ""}
                        </span>
                      </td>
                      <td className="text-right tabular font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                        +{formatCOP(Number(item.monto_cuota || item.monto_liberado) || 0)}
                      </td>
                      <td className="text-right tabular font-mono">
                        {item.nuevo_saldo_disponible !== undefined ? (
                          <span className="inline-flex items-center gap-1 font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {formatCOP(Number(item.nuevo_saldo_disponible))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Actualizado</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {detallesFiltrados.length} registro(s) verificado(s).
          </p>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-6 font-semibold"
          >
            Entendido y Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
