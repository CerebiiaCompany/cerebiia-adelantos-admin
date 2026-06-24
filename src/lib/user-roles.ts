import type { UserRole } from "@/lib/api/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  empresa: "Empresa",
  empleado: "Empleado",
};

export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  super_admin: "bg-primary/15 text-primary border-primary/30",
  empresa: "bg-info/15 text-info border-info/30",
  empleado: "bg-secondary text-foreground border-border",
};
