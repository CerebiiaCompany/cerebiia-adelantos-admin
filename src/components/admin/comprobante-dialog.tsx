import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileImage, FileText, Loader2 } from "lucide-react";
import { formatCOP, type Adelanto } from "@/lib/admin-store";
import { getSolicitudDetalle } from "@/lib/api/adelantos";
import { resolveComprobanteUrl } from "@/lib/adelantos-mapper";
import { getComprobanteFileKind } from "@/lib/api/config";
import { isBackendUuid } from "@/lib/api/is-api-id";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ComprobanteDialogProps = {
  adelanto: Adelanto | null;
  empresa?: string;
  onClose: () => void;
};

export function ComprobanteDialog({ adelanto, empresa, onClose }: ComprobanteDialogProps) {
  const [loadError, setLoadError] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!adelanto) {
      setResolvedUrl(null);
      setLoadError(false);
      setResolveError(null);
      setResolving(false);
      return;
    }

    setLoadError(false);
    setResolveError(null);

    const localUrl = adelanto.comprobanteUrl?.trim() || null;
    const looksLikeAbsoluteOrMedia =
      !!localUrl &&
      (localUrl.startsWith("http://") ||
        localUrl.startsWith("https://") ||
        localUrl.startsWith("/media/") ||
        localUrl.includes("/"));

    if (looksLikeAbsoluteOrMedia) {
      setResolvedUrl(localUrl);
      return;
    }

    if (!isBackendUuid(adelanto.id)) {
      setResolvedUrl(localUrl);
      return;
    }

    let cancelled = false;
    setResolving(true);
    void (async () => {
      try {
        const detalle = await getSolicitudDetalle(adelanto.id);
        const url = resolveComprobanteUrl(
          detalle.solicitud.comprobante_pago_url,
          detalle.solicitud.comprobante_pago,
        );
        if (!cancelled) {
          setResolvedUrl(url ?? localUrl);
          if (!url && !localUrl) {
            setResolveError("Esta solicitud no tiene comprobante adjunto.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setResolvedUrl(localUrl);
          setResolveError(
            err instanceof ApiError
              ? err.message
              : "No se pudo obtener la URL del comprobante.",
          );
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [adelanto]);

  const evidenceUrl = resolvedUrl?.trim() || null;
  const fileKind = useMemo(
    () => (evidenceUrl ? getComprobanteFileKind(evidenceUrl) : "other"),
    [evidenceUrl],
  );

  const subtitle = useMemo(() => {
    if (!adelanto) return "";
    const parts: string[] = [];
    parts.push(adelanto.empleadoNombre);
    if (empresa) parts.push(empresa);
    parts.push(formatCOP(adelanto.monto));
    if (adelanto.fechaPago) {
      parts.push(
        new Date(adelanto.fechaPago).toLocaleDateString("es-CO", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      );
    }
    return parts.join(" · ");
  }, [adelanto, empresa]);

  return (
    <Dialog
      open={!!adelanto}
      onOpenChange={(open) => {
        if (!open) {
          setLoadError(false);
          setResolveError(null);
          setResolvedUrl(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border/80 px-6 py-4 text-left">
          <DialogTitle className="font-normal">Comprobante de pago</DialogTitle>
          <DialogDescription className="font-normal">
            {subtitle || "Imagen o archivo que el administrador adjuntó al desembolsar."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          {resolving && (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-normal py-12">
              <Loader2 className="size-4 animate-spin" />
              Cargando comprobante…
            </p>
          )}

          {!resolving && resolveError && !evidenceUrl && (
            <p className="text-center text-sm text-destructive font-normal py-8">{resolveError}</p>
          )}

          {!resolving && !evidenceUrl && !resolveError && (
            <p className="text-center text-sm text-muted-foreground font-normal py-8">
              No hay evidencia disponible para esta solicitud.
            </p>
          )}

          {!resolving && evidenceUrl && loadError && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <FileText className="size-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground font-normal">
                No pudimos previsualizar el archivo en este panel. Ábrelo directamente.
              </p>
              <Button asChild variant="outline" className="font-normal">
                <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Abrir archivo
                </a>
              </Button>
            </div>
          )}

          {!resolving && evidenceUrl && !loadError && fileKind === "image" && (
            <div className="flex justify-center bg-muted/30 rounded-xl p-2">
              <img
                key={evidenceUrl}
                src={evidenceUrl}
                alt="Comprobante de transferencia del adelanto"
                className="max-h-[60vh] w-auto max-w-full rounded-lg border border-border object-contain shadow-sm"
                onError={() => setLoadError(true)}
              />
            </div>
          )}

          {!resolving && evidenceUrl && !loadError && fileKind === "pdf" && (
            <iframe
              key={evidenceUrl}
              src={evidenceUrl}
              title="Comprobante de transferencia PDF"
              className="h-[60vh] w-full rounded-xl border border-border bg-background"
            />
          )}

          {!resolving && evidenceUrl && !loadError && fileKind === "other" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <FileImage className="size-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground font-normal">
                Archivo adjunto listo para consulta.
              </p>
              <Button asChild variant="outline" className="font-normal">
                <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Ver evidencia
                </a>
              </Button>
            </div>
          )}

          {!resolving && evidenceUrl && !loadError && (
            <div className="mt-4 flex justify-end">
              <Button asChild variant="ghost" size="sm" className="font-normal">
                <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Abrir en pestaña nueva
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
