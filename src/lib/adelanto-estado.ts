import type { EstadoAdelanto } from "@/lib/admin-store";

export const ESTADO_BADGE_CLASSES: Record<EstadoAdelanto, string> = {
  solicitado: "bg-info/15 text-info border-info/30",
  en_revision: "bg-warning/15 text-warning border-warning/30",
  aprobado: "bg-primary/15 text-primary border-primary/30",
  pagado: "bg-success/15 text-success border-success/30",
  rechazado: "bg-destructive/15 text-destructive border-destructive/30",
};

export const ESTADO_TEXT_CLASSES: Record<EstadoAdelanto, string> = {
  solicitado: "text-info",
  en_revision: "text-warning",
  aprobado: "text-primary",
  pagado: "text-success",
  rechazado: "text-destructive",
};
