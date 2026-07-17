import { useCallback, useEffect, useMemo, useState } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { getSolicitudAdmin, listCuotasSolicitud } from "@/lib/api/adelantos";
import { syncPagarCuota } from "@/lib/adelantos-api-sync";
import { ApiError } from "@/lib/api/errors";
import { isBackendUuid } from "@/lib/api/is-api-id";
import { estadoLabel, formatCOP } from "@/lib/admin-store";
import { ESTADO_BADGE_CLASSES } from "@/lib/adelanto-estado";
import type { CuotaAdelantoApi, SolicitudAdminApi } from "@/lib/api/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
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

const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-normal";
const valueClass = "text-sm tabular-nums text-foreground font-normal mt-0.5";
const noteClass = "text-[11px] text-muted-foreground font-normal mt-1 leading-snug";

export function SolicitudDetalleDrawer({ solicitudId, onClose }: Props) {
  const [detalle, setDetalle] = useState<SolicitudAdminApi | null>(null);
  const [cuotas, setCuotas] = useState<CuotaAdelantoApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payingCuotaId, setPayingCuotaId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!solicitudId || !isBackendUuid(solicitudId)) {
      setDetalle(null);
      setCuotas([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [admin, cuotasData] = await Promise.all([
        getSolicitudAdmin(solicitudId),
        listCuotasSolicitud(solicitudId),
      ]);
      setDetalle(admin);
      setCuotas(cuotasData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el detalle.");
      setDetalle(null);
      setCuotas([]);
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePagarCuota = async (cuotaId: string) => {
    setPayingCuotaId(cuotaId);
    setError(null);
    try {
      await syncPagarCuota(cuotaId);
      setCuotas((prev) =>
        prev.map((c) =>
          c.id === cuotaId
            ? { ...c, estado: "pagada" as const, fecha_pago: new Date().toISOString() }
            : c,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo marcar la cuota como pagada.");
    } finally {
      setPayingCuotaId(null);
    }
  };

  const estadoUi = detalle?.estado;
  const tieneContexto = Boolean(detalle?.tiene_contexto_operativo);

  const saldoConsumo = useMemo(() => {
    if (!detalle?.tiene_contexto_operativo) return null;

    const despues = parseMoney(detalle.saldo_disponible_despues);
    const totalMes = parseMoney(detalle.total_adelantos_mes);
    const antes = parseMoney(detalle.saldo_disponible_antes);

    // Cupo total = lo ya consumido del mes + lo que aún queda disponible.
    // Así la gráfica refleja el consumo sobre el saldo disponible total, no solo esta solicitud.
    let cupoTotal: number | null = null;
    let consumido: number | null = null;
    let restante: number | null = null;

    if (despues != null && totalMes != null && totalMes >= 0 && despues >= 0) {
      cupoTotal = despues + totalMes;
      consumido = totalMes;
      restante = despues;
    } else if (antes != null && despues != null && antes > 0) {
      // Fallback si falta total del mes (registros incompletos).
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
    <Sheet open={!!solicitudId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto font-sans">
        <SheetHeader>
          <SheetTitle className="font-normal tracking-tight text-xl">
            Detalles de solicitud
          </SheetTitle>
          <SheetDescription className="font-normal text-sm leading-relaxed">
            Datos de la solicitud y contexto operativo para validar el adelanto.
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground font-normal py-8">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </p>
        )}

        {error && (
          <p className="text-sm font-normal text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 mt-4">
            {error}
          </p>
        )}

        {detalle && !loading && (
          <div className="mt-6 space-y-5 font-normal">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base text-foreground font-normal tracking-tight">
                    {detalle.empleado.nombre}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums font-normal mt-0.5">
                    Doc. {detalle.empleado.documento}
                  </p>
                </div>
                {estadoUi && (
                  <span
                    className={cn(
                      "inline-flex text-xs font-normal rounded-md border px-2 py-0.5 shrink-0",
                      ESTADO_BADGE_CLASSES[estadoUi as keyof typeof ESTADO_BADGE_CLASSES] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {estadoLabel[estadoUi as keyof typeof estadoLabel] ?? detalle.estado}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-normal">{detalle.empresa.nombre}</p>
              <p className="text-xs text-muted-foreground tabular-nums font-normal">
                NIT {detalle.empresa.nit} ·{" "}
                {new Date(detalle.created_at).toLocaleString("es-CO")}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className={labelClass}>Monto solicitado</dt>
                <dd className={valueClass}>{formatCOP(Number(detalle.monto))}</dd>
              </div>
              <div>
                <dt className={labelClass}>Monto neto</dt>
                <dd className={cn(valueClass, "text-primary")}>
                  {formatCOP(Number(detalle.monto_neto))}
                </dd>
              </div>
              <div>
                <dt className={labelClass}>Cuotas</dt>
                <dd className={valueClass}>{detalle.numero_cuotas_snapshot}</dd>
              </div>
              <div>
                <dt className={labelClass}>Plazo (días)</dt>
                <dd className={valueClass}>{detalle.plazo_dias_snapshot}</dd>
              </div>
            </dl>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary shrink-0" strokeWidth={1.75} />
                <p className={cn(labelClass, "tracking-[0.1em]")}>Validación operativa</p>
              </div>
              <p className="text-xs text-muted-foreground font-normal leading-relaxed">
                Congelado al momento de crear la solicitud. Permite verificar si el adelanto era
                coherente con el cupo y la nómina.
              </p>

              {tieneContexto ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-md bg-muted/40 px-3 py-2.5">
                    <dt className={labelClass}>Disponible antes</dt>
                    <dd className={valueClass}>{moneyOrDash(detalle.saldo_disponible_antes)}</dd>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2.5">
                    <dt className={labelClass}>Disponible después</dt>
                    <dd className={valueClass}>{moneyOrDash(detalle.saldo_disponible_despues)}</dd>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2.5">
                    <dt className={labelClass}>Nómina antes</dt>
                    <dd className={valueClass}>{moneyOrDash(detalle.nomina_antes)}</dd>
                    <p className={noteClass}>Salario − adelantos previos del mes</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2.5">
                    <dt className={labelClass}>Nómina después</dt>
                    <dd className={valueClass}>{moneyOrDash(detalle.nomina_despues)}</dd>
                    <p className={noteClass}>Salario − adelantos del mes (incl. esta)</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-3 py-2.5 sm:col-span-2">
                    <dt className={labelClass}>Total adelantos en el mes</dt>
                    <dd className={valueClass}>{moneyOrDash(detalle.total_adelantos_mes)}</dd>
                    <p className={noteClass}>
                      Suma del mes (excluye rechazados), incluyendo esta solicitud
                    </p>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground font-normal rounded-md border border-dashed border-border px-3 py-4 text-center leading-relaxed">
                  Esta solicitud se creó antes del registro de snapshots operativos. Los valores
                  históricos no están disponibles.
                </p>
              )}
            </div>

            {detalle.motivo_rechazo && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className={cn(labelClass, "text-destructive mb-1")}>Motivo de rechazo</p>
                <p className="text-sm font-normal whitespace-pre-wrap leading-relaxed">
                  {detalle.motivo_rechazo}
                </p>
              </div>
            )}

            {cuotas.length > 0 && (
              <div className="space-y-2">
                <p className={cn(labelClass, "tracking-[0.1em]")}>Cuotas de nómina</p>
                <ul className="space-y-2">
                  {cuotas.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-normal tabular-nums">
                          Cuota {c.numero} · {formatCOP(Number(c.monto))}
                        </p>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5">
                          Corte {c.fecha_corte}
                        </p>
                      </div>
                      {c.estado === "pagada" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-normal text-success">
                          <CheckCircle2 className="size-3.5" strokeWidth={1.75} />
                          Pagada
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 font-normal"
                          disabled={payingCuotaId === c.id}
                          onClick={() => void handlePagarCuota(c.id)}
                        >
                          {payingCuotaId === c.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Marcar pagada"
                          )}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {saldoConsumo && (
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div>
                  <p className={cn(labelClass, "tracking-[0.1em]")}>
                    Saldo disponible consumido
                  </p>
                  <p className="text-xs text-muted-foreground font-normal mt-1 leading-relaxed">
                    Porcentaje del saldo disponible total ya utilizado (adelantos del mes) frente al
                    cupo completo del empleado.
                  </p>
                </div>

                <ChartContainer
                  config={saldoChartConfig}
                  className="mx-auto aspect-square w-full max-w-[220px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-4 font-normal">
                              <span className="text-muted-foreground">
                                {name === "consumido" ? "Consumido" : "Disponible"}
                              </span>
                              <span className="tabular-nums text-foreground">
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
                      innerRadius={58}
                      outerRadius={82}
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
                                  y={(viewBox.cy ?? 0) - 6}
                                  className="fill-foreground text-2xl tabular-nums"
                                  style={{ fontWeight: 400 }}
                                >
                                  {saldoConsumo.pctConsumido}%
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy ?? 0) + 16}
                                  className="fill-muted-foreground text-[11px]"
                                  style={{ fontWeight: 400 }}
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

                <p className="text-center text-[11px] text-muted-foreground font-normal tabular-nums">
                  Cupo total · {formatCOP(saldoConsumo.cupoTotal)}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-normal">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">
                      Consumido · {formatCOP(saldoConsumo.consumido)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-muted-foreground/35" />
                    <span className="text-muted-foreground">
                      Disponible · {formatCOP(saldoConsumo.restante)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
