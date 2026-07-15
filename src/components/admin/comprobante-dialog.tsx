import { useMemo, useState } from "react";
import { ExternalLink, FileImage, FileText } from "lucide-react";
import { formatCOP, type Adelanto } from "@/lib/admin-store";
import { getComprobanteFileKind } from "@/lib/api/config";
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
  const evidenceUrl = adelanto?.comprobanteUrl?.trim() || null;
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
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border/80 px-6 py-4 text-left">
          <DialogTitle>Evidencia de transferencia</DialogTitle>
          <DialogDescription>
            {subtitle ||
              "Comprobante adjuntado al desembolsar el adelanto al empleado."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          {!evidenceUrl ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay evidencia disponible para esta solicitud.
            </p>
          ) : loadError ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <FileText className="size-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No pudimos previsualizar el archivo. Ábrelo o descárgalo directamente.
              </p>
              <Button asChild variant="outline">
                <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Abrir archivo
                </a>
              </Button>
            </div>
          ) : fileKind === "image" ? (
            <div className="flex justify-center">
              <img
                src={evidenceUrl}
                alt="Comprobante de transferencia del adelanto"
                className="max-h-[60vh] w-auto max-w-full rounded-xl border border-border object-contain shadow-sm"
                onError={() => setLoadError(true)}
              />
            </div>
          ) : fileKind === "pdf" ? (
            <iframe
              src={evidenceUrl}
              title="Comprobante de transferencia PDF"
              className="h-[60vh] w-full rounded-xl border border-border bg-background"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <FileImage className="size-10 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">Archivo adjunto listo para consulta.</p>
              <Button asChild variant="outline">
                <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 size-4" />
                  Ver evidencia
                </a>
              </Button>
            </div>
          )}

          {evidenceUrl && !loadError && (
            <div className="mt-4 flex justify-end">
              <Button asChild variant="ghost" size="sm">
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
