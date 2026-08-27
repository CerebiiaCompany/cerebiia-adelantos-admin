import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { getSolicitudAdmin } from "@/lib/api/adelantos";
import { ApiError } from "@/lib/api/errors";
import { isBackendUuid } from "@/lib/api/is-api-id";
import { estadoLabel, formatCOP } from "@/lib/admin-store";
import { ESTADO_BADGE_CLASSES } from "@/lib/adelanto-estado";
import type { SolicitudAdminApi } from "@/lib/api/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, FileText, User, Building2, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  solicitudId: string | null;
  onClose: () => void;
};

function moneyOrDash(value: string | null | undefined) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return formatCOP(n);
}

function parseMoney(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const saldoChartConfig = {
  consumido: {
    label: "Consumido",
    color: "hsl(var(--primary))",
  },
  restante: {
    label: "Disponible",
    color: "hsl(var(--muted))",
  },
} satisfies ChartConfig;

const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-medium";
const valueClass = "text-sm tabular font-mono text-foreground font-normal mt-0.5";
const noteClass = "text-[11px] text-muted-foreground font-normal mt-1 leading-snug";

export function SolicitudDetalleDrawer({ solicitudId, onClose }: Props) {
  const [detalle, setDetalle] = useState<SolicitudAdminApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!solicitudId || !isBackendUuid(solicitudId)) {
      setDetalle(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const admin = await getSolicitudAdmin(solicitudId);
      setDetalle(admin);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el detalle.");
      setDetalle(null);
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  useEffect(() => {
    void load();
  }, [load]);

  const estadoUi = detalle?.estado;
  const tieneContexto = Boolean(detalle?.tiene_contexto_operativo);

  const saldoConsumo = useMemo(() => {
    if (!detalle?.tiene_contexto_operativo) return null;

    const despues = parseMoney(detalle.saldo_disponible_despues);
    const totalMes = parseMoney(detalle.total_adelantos_mes);
    const antes = parseMoney(detalle.saldo_disponible_antes);

    let cupoTotal: number | null = null;
    let consumido: number | null = null;
    let restante: number | null = null;

    if (despues != null && totalMes != null && totalMes >= 0 && despues >= 0) {
      cupoTotal = despues + totalMes;
      consumido = totalMes;
      restante = despues;
    } else if (antes != null && despues != null && antes > 0) {
      cupoTotal = antes;
      consumido = Math.max(0, antes - despues);
      restante = Math.max(0, despues);
    }

    if (cupoTotal == null || consumido == null || restante == null || cupoTotal <= 0) {
      return null;
    }

    const pctConsumido = Math.min(100, Math.round((consumido / cupoTotal) * 1000) / 10);

    return {
      cupoTotal,
      consumido,
      restante,
      pctConsumido,
      chartData: [
        { name: "consumido", value: consumido, fill: "var(--color-consumido)" },
        {
          name: "restante",
          value: restante > 0 ? restante : 0.0001,
          fill: "var(--color-restante)",
        },
      ],
    };
  }, [detalle]);

  return (
    <Dialog open={!!solicitudId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92svh] overflow-y-auto p-0 rounded-2xl sm:rounded-3xl border bg-background shadow-2xl">
        {/* HEADER */}
        <div className="p-4 sm:p-6 border-b bg-gradient-to-br from-primary/10 via-background to-purple-500/5 dark:from-primary/20 dark:via-background dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl sm:rounded-2xl bg-primary/15 text-primary grid place-items-center shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                Detalles de solicitud
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Datos de la solicitud y contexto operativo para validar el adelanto.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-normal">Cargando detalles de la solicitud…</p>
            </div>
          )}

          {error && (
            <p className="text-sm font-normal text-destructive rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              {error}
            </p>
          )}

          {detalle && !loading && (
            <div className="space-y-4 sm:space-y-6">
              {/* BENEFICIARIO & ESTADO */}
              <div className="rounded-2xl border border-border/80 bg-surface/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="size-4 text-primary shrink-0" />
                    <span className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                      {detalle.empleado.nombre}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      (Doc. {detalle.empleado.documento})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5" />
                      <span>{detalle.empresa.nombre}</span>
                      <span className="font-mono text-[11px]">(NIT {detalle.empresa.nit})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      <span className="font-mono text-[11px]">
                        {new Date(detalle.created_at).toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                </div>

                {estadoUi && (
                  <div>
                    <span
                      className={cn(
                        "inline-flex text-xs font-medium rounded-lg border px-3 py-1 shrink-0",
                        ESTADO_BADGE_CLASSES[estadoUi as keyof typeof ESTADO_BADGE_CLASSES] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {estadoLabel[estadoUi as keyof typeof estadoLabel] ?? detalle.estado}
                    </span>
                  </div>
                )}
              </div>

              {/* TABLITA CONDICIONES FINANCIERAS */}
              <div className="overflow-x-auto rounded-2xl border border-primary/20 bg-primary/[0.04] dark:bg-primary/[0.08]">
                <table className="min-w-[28rem] sm:min-w-full w-full text-xs">
                  <thead>
                    <tr className="border-b border-primary/15 bg-primary/[0.06] dark:bg-primary/[0.12] text-muted-foreground">
                      <th className="py-2.5 px-3 sm:px-4 text-left font-medium">Monto solicitado</th>
                      <th className="py-2.5 px-3 sm:px-4 text-right font-medium">Monto neto</th>
                      <th className="py-2.5 px-3 sm:px-4 text-right font-medium">Comisión</th>
                      <th className="py-2.5 px-3 sm:px-4 text-center font-medium">Cuotas</th>
                      <th className="py-2.5 px-3 sm:px-4 text-center font-medium">Plazo (días)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-3 px-3 sm:px-4 text-left font-normal tabular font-mono text-foreground text-xs sm:text-sm">
                        {formatCOP(Number(detalle.monto))}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right font-normal tabular font-mono text-primary text-xs sm:text-sm">
                        {formatCOP(Number(detalle.monto_neto))}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right font-normal tabular font-mono text-foreground text-xs sm:text-sm">
                        {Number(detalle.monto_neto) >= Number(detalle.monto) ||
                        (detalle.tarifa_total != null && Number(detalle.tarifa_total) === 0) ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-normal text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Gratis ($0)
                          </span>
                        ) : (
                          formatCOP(
                            detalle.tarifa_total != null
                              ? Number(detalle.tarifa_total)
                              : Math.max(0, Number(detalle.monto) - Number(detalle.monto_neto)),
                          )
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center font-normal tabular font-mono text-foreground text-xs sm:text-sm">
                        {detalle.numero_cuotas_snapshot}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center font-normal tabular font-mono text-foreground text-xs sm:text-sm">
                        {detalle.plazo_dias_snapshot}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* MOTIVO DE RECHAZO SI APLICA */}
              {detalle.motivo_rechazo && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className={cn(labelClass, "text-destructive mb-1")}>Motivo de rechazo</p>
                  <p className="text-sm font-normal whitespace-pre-wrap leading-relaxed text-foreground">
                    {detalle.motivo_rechazo}
                  </p>
                </div>
              )}

              {/* VALIDACIÓN OPERATIVA & GRÁFICA */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                {/* VALIDACIÓN OPERATIVA */}
                <div
                  className={cn(
                    "rounded-2xl border border-border bg-surface/60 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xs",
                    saldoConsumo ? "lg:col-span-7" : "lg:col-span-12",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary shrink-0" strokeWidth={1.75} />
                    <p className={cn(labelClass, "tracking-[0.1em] text-foreground font-semibold")}>
                      Validación operativa
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground font-normal leading-relaxed">
                    Congelado al momento de crear la solicitud. Permite verificar si el adelanto era
                    coherente con el cupo y la nómina.
                  </p>

                  {tieneContexto ? (
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                      <div className="rounded-xl bg-background/80 border border-border/60 p-2.5 sm:p-3">
                        <dt className={labelClass}>Disponible antes</dt>
                        <dd className={valueClass}>{moneyOrDash(detalle.saldo_disponible_antes)}</dd>
                      </div>
                      <div className="rounded-xl bg-background/80 border border-border/60 p-2.5 sm:p-3">
                        <dt className={labelClass}>Disponible después</dt>
                        <dd className={valueClass}>{moneyOrDash(detalle.saldo_disponible_despues)}</dd>
                      </div>
                      <div className="rounded-xl bg-background/80 border border-border/60 p-2.5 sm:p-3">
                        <dt className={labelClass}>Nómina antes</dt>
                        <dd className={valueClass}>{moneyOrDash(detalle.nomina_antes)}</dd>
                        <p className={noteClass}>Salario − adelantos previos del mes</p>
                      </div>
                      <div className="rounded-xl bg-background/80 border border-border/60 p-2.5 sm:p-3">
                        <dt className={labelClass}>Nómina después</dt>
                        <dd className={valueClass}>{moneyOrDash(detalle.nomina_despues)}</dd>
                        <p className={noteClass}>Salario − adelantos del mes (incl. esta)</p>
                      </div>
                      <div className="rounded-xl bg-background/80 border border-border/60 p-2.5 sm:p-3 sm:col-span-2">
                        <dt className={labelClass}>Total adelantos en el mes</dt>
                        <dd className={valueClass}>{moneyOrDash(detalle.total_adelantos_mes)}</dd>
                        <p className={noteClass}>
                          Suma del mes (excluye rechazados), incluyendo esta solicitud
                        </p>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-xs text-muted-foreground font-normal rounded-xl border border-dashed border-border/80 p-4 text-center leading-relaxed">
                      Esta solicitud se creó antes del registro de snapshots operativos. Los valores
                      históricos no están disponibles.
                    </p>
                  )}
                </div>

                {/* GRÁFICA DE CONSUMO */}
                {saldoConsumo && (
                  <div className="lg:col-span-5 rounded-2xl border border-border bg-surface/60 p-5 space-y-3 shadow-xs">
                    <div>
                      <p className={cn(labelClass, "tracking-[0.1em] text-foreground font-semibold")}>
                        Saldo disponible consumido
                      </p>
                      <p className="text-xs text-muted-foreground font-normal mt-1 leading-relaxed">
                        Porcentaje del saldo disponible total utilizado frente al cupo completo del empleado.
                      </p>
                    </div>

                    <ChartContainer
                      config={saldoChartConfig}
                      className="mx-auto aspect-square w-full max-w-[190px]"
                    >
                      <PieChart>
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value, name) => (
                                <div className="flex w-full items-center justify-between gap-4 font-normal text-xs">
                                  <span className="text-muted-foreground">
                                    {name === "consumido" ? "Consumido" : "Disponible"}
                                  </span>
                                  <span className="tabular font-mono text-foreground font-normal">
                                    {formatCOP(Number(value))}
                                  </span>
                                </div>
                              )}
                            />
                          }
                        />
                        <Pie
                          data={saldoConsumo.chartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={74}
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                        >
                          {saldoConsumo.chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                          <Label
                            content={({ viewBox }) => {
                              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                  <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy ?? 0) - 4}
                                      className="fill-foreground text-xl tabular font-mono font-normal"
                                    >
                                      {saldoConsumo.pctConsumido}%
                                    </tspan>
                                    <tspan
                                      x={viewBox.cx}
                                      y={(viewBox.cy ?? 0) + 14}
                                      className="fill-muted-foreground text-[10px] uppercase font-medium"
                                    >
                                      consumido
                                    </tspan>
                                  </text>
                                );
                              }
                              return null;
                            }}
                          />
                        </Pie>
                      </PieChart>
                    </ChartContainer>

                    <p className="text-center text-xs text-muted-foreground font-mono font-normal tabular">
                      Cupo total · {formatCOP(saldoConsumo.cupoTotal)}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-normal pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground text-[11px] font-mono">
                          Consumido: {formatCOP(saldoConsumo.consumido)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-muted-foreground/35" />
                        <span className="text-muted-foreground text-[11px] font-mono">
                          Disponible: {formatCOP(saldoConsumo.restante)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
