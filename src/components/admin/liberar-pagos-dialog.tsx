import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCOP } from "@/lib/admin-store";
import { liberarCuotasEmpresa } from "@/lib/api/admin";
import type { ControlPagoEmpresaApi, LiberarCuotasResponse } from "@/lib/api/types";
import { toast } from "sonner";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

interface LiberarPagosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: ControlPagoEmpresaApi | null;
  periodo: string; // "YYYY-MM"
  periodoLabel?: string;
  onSuccess?: (res: LiberarCuotasResponse) => void;
}

export function LiberarPagosDialog({
  open,
  onOpenChange,
  empresa,
  periodo,
  periodoLabel,
  onSuccess,
}: LiberarPagosDialogProps) {
  const [tipoLiberacion, setTipoLiberacion] = useState<"periodo" | "todas">("periodo");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [nota, setNota] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCobrar = Number(empresa?.total_a_cobrar) || 0;
  const totalPagado = Number(empresa?.total_pagado) || 0;
  const solicitudesCount = empresa?.solicitudes_pagadas || 0;

  const handleConfirm = async () => {
    if (!empresa) return;
    try {
      setSubmitting(true);
      setError(null);

      const [anioStr, mesStr] = periodo.split("-");
      const anio = parseInt(anioStr, 10);
      const mes = parseInt(mesStr, 10);

      const res = await liberarCuotasEmpresa({
        empresa_id: empresa.empresa_id,
        periodo,
        anio,
        mes,
        numero_cuota: undefined,
        referencia_pago: referenciaPago.trim() || undefined,
        nota: nota.trim() || undefined,
      });

      toast.success(
        res.message ||
          `Cuotas liberadas exitosamente para ${empresa.empresa_nombre}. El saldo disponible de los empleados ha sido actualizado.`,
        {
          duration: 5000,
        },
      );

      onOpenChange(false);
      onSuccess?.(res);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        "No se pudo completar la liberación de cuotas. Intenta nuevamente.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !empresa) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border bg-background shadow-2xl">
        {/* HEADER */}
        <div className="p-6 border-b bg-gradient-to-br from-emerald-500/10 via-background to-blue-500/5 dark:from-emerald-950/30 dark:via-background dark:to-blue-950/20">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white grid place-items-center shadow-lg shadow-emerald-600/20 shrink-0">
              <Coins className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Liberar Pagos de Cuotas
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50">
                  Amortización
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                Registra el pago de cuotas por parte de la empresa y libera automáticamente el saldo disponible de cada empleado.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* BANNER EXPLICATIVO */}
          <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/30 p-3.5 flex items-start gap-3 text-xs leading-relaxed text-blue-900 dark:text-blue-200">
            <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-950 dark:text-blue-100">
                ¿Cómo funciona la liberación de pagos?
              </p>
              <p className="mt-0.5 text-blue-800/90 dark:text-blue-300/90">
                Cuando la empresa paga a Cerebiia los descuentos de nómina correspondientes a la <strong>Cuota 1</strong> (o cuota del mes), ese monto amortizado se reintegra de forma inmediata en el <strong>Saldo Disponible</strong> de cada empleado para que puedan solicitar nuevos adelantos.
              </p>
            </div>
          </div>

          {/* TARJETA DE RESUMEN DE LA EMPRESA */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="size-4 text-primary" />
                {empresa.empresa_nombre}
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                NIT: {empresa.empresa_nit || "—"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/50 text-xs">
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" /> Periodo
                </p>
                <p className="font-semibold text-foreground mt-0.5">
                  {periodoLabel || periodo}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Wallet className="size-3" /> Total del periodo
                </p>
                <p className="font-semibold text-primary mt-0.5">
                  {formatCOP(totalCobrar)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Adelantos pagados
                </p>
                <p className="font-semibold text-foreground mt-0.5">
                  {solicitudesCount} solicitud{solicitudesCount === 1 ? "" : "es"}
                </p>
              </div>
            </div>
          </div>

          {/* SELECCIÓN DEL TIPO DE LIBERACIÓN */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold text-foreground">
              Alcance de la liberación
            </Label>
            <RadioGroup
              value={tipoLiberacion}
              onValueChange={(v) => setTipoLiberacion(v as "periodo" | "todas")}
              className="grid grid-cols-1 gap-2.5"
            >
              <label
                htmlFor="r-periodo"
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  tipoLiberacion === "periodo"
                    ? "border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm"
                    : "border-border/80 hover:bg-muted/40"
                }`}
              >
                <RadioGroupItem value="periodo" id="r-periodo" className="mt-0.5" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      Liberar cuotas programadas de este periodo
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Amortiza la cuota que vence en este periodo ({periodoLabel || periodo}) para cada empleado (sea Cuota 1, 2 o 3 de su adelanto) y reintegra inmediatamente el valor pagado a su saldo disponible.
                  </p>
                </div>
              </label>

              <label
                htmlFor="r-todas"
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  tipoLiberacion === "todas"
                    ? "border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm"
                    : "border-border/80 hover:bg-muted/40"
                }`}
              >
                <RadioGroupItem value="todas" id="r-todas" className="mt-0.5" />
                <div className="flex-1 text-xs">
                  <span className="font-bold text-foreground">
                    Liberar todas las cuotas pendientes (Liquidación total)
                  </span>
                  <p className="text-muted-foreground mt-1">
                    Marca como pagadas todas las cuotas restantes de los adelantos activos de la empresa, restaurando el 100% del saldo comprometido de los empleados.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* CAMPOS OPCIONALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ref-pago" className="text-xs font-medium text-muted-foreground">
                Referencia de pago / Transferencia (opcional)
              </Label>
              <Input
                id="ref-pago"
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="Ej. TRX-938210 / Comprobante 450"
                className="h-9 text-xs rounded-xl"
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nota-liberacion" className="text-xs font-medium text-muted-foreground">
                Observaciones internas (opcional)
              </Label>
              <Input
                id="nota-liberacion"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej. Recibido por Bancolombia"
                className="h-9 text-xs rounded-xl"
                disabled={submitting}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Liberando pagos…
              </>
            ) : (
              <>
                <ShieldCheck className="size-4 mr-2" />
                Confirmar y Liberar Saldo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
