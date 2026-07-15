import { useCallback, useEffect, useState } from "react";
import { getSolicitudAdmin, listCuotasSolicitud } from "@/lib/api/adelantos";
import { syncPagarCuota } from "@/lib/adelantos-api-sync";
import { ApiError } from "@/lib/api/errors";
import { isBackendUuid } from "@/lib/api/is-api-id";
import { estadoLabel, formatCOP } from "@/lib/admin-store";
import { ESTADO_BADGE_CLASSES } from "@/lib/adelanto-estado";
import type { CuotaAdelantoApi, SolicitudAdminApi } from "@/lib/api/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  solicitudId: string | null;
  onClose: () => void;
};

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
      // Admin (labels) + cuotas en paralelo — evita descarga de detalle duplicado.
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
          c.id === cuotaId ? { ...c, estado: "pagada" as const, fecha_pago: new Date().toISOString() } : c,
        ),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo marcar la cuota como pagada.");
    } finally {
      setPayingCuotaId(null);
    }
  };

  const estadoUi = detalle?.estado;

  return (
    <Sheet open={!!solicitudId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalle de solicitud</SheetTitle>
          <SheetDescription>Datos completos desde el API admin.</SheetDescription>
        </SheetHeader>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 mt-4">
            {error}
          </p>
        )}

        {detalle && !loading && (
          <div className="mt-6 space-y-5">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{detalle.empleado.nombre}</p>
                  <p className="text-xs text-muted-foreground tabular">
                    CC {detalle.empleado.documento}
                  </p>
                </div>
                {estadoUi && (
                  <span
                    className={cn(
                      "inline-flex text-xs font-medium rounded-md border px-2 py-0.5 shrink-0",
                      ESTADO_BADGE_CLASSES[estadoUi as keyof typeof ESTADO_BADGE_CLASSES] ??
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {estadoLabel[estadoUi as keyof typeof estadoLabel] ?? detalle.estado}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{detalle.empresa.nombre}</p>
              <p className="text-xs text-muted-foreground tabular">
                NIT {detalle.empresa.nit} · {new Date(detalle.created_at).toLocaleString("es-CO")}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Monto solicitado</dt>
                <dd className="font-semibold tabular">{formatCOP(Number(detalle.monto))}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Monto neto</dt>
                <dd className="font-semibold tabular text-primary">
                  {formatCOP(Number(detalle.monto_neto))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Cuotas</dt>
                <dd className="font-semibold tabular">{detalle.numero_cuotas_snapshot}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Plazo (días)</dt>
                <dd className="font-semibold tabular">{detalle.plazo_dias_snapshot}</dd>
              </div>
            </dl>

            {detalle.motivo_rechazo && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive mb-1">Motivo de rechazo</p>
                <p className="text-sm whitespace-pre-wrap">{detalle.motivo_rechazo}</p>
              </div>
            )}

            {cuotas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cuotas de nómina
                </p>
                <ul className="space-y-2">
                  {cuotas.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium tabular">
                          Cuota {c.numero} · {formatCOP(Number(c.monto))}
                        </p>
                        <p className="text-xs text-muted-foreground">Corte {c.fecha_corte}</p>
                      </div>
                      {c.estado === "pagada" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <CheckCircle2 className="size-3.5" />
                          Pagada
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
