import type { AuthUser } from "@/lib/api/types";
import { SUPER_ADMIN_ROLE } from "@/lib/api/types";
import { getUserInitials } from "@/lib/theme";
import { ProfileAvatar } from "@/components/admin/profile-avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield } from "lucide-react";

type AdminAccountDialogProps = {
  user: AuthUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatRole(role: string) {
  if (role === SUPER_ADMIN_ROLE) return "Super Administrador";
  return role.replace(/_/g, " ");
}

function formatDateLong(iso: string) {
  const formatted = new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDateTime(iso: string) {
  const formatted = new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const FIELDS: { key: keyof AuthUser | "role_label"; label: string; format?: (user: AuthUser) => string }[] = [
  { key: "full_name", label: "Nombre completo" },
  { key: "email", label: "Correo electrónico" },
  { key: "role_label", label: "Rol", format: (u) => formatRole(u.role) },
  {
    key: "is_active",
    label: "Estado de la cuenta",
    format: (u) => (u.is_active ? "Activa" : "Inactiva"),
  },
  { key: "id", label: "ID de usuario" },
  { key: "created_at", label: "Miembro desde", format: (u) => formatDateLong(u.created_at) },
  { key: "updated_at", label: "Última actualización", format: (u) => formatDateTime(u.updated_at) },
];

export function AdminAccountDialog({ user, open, onOpenChange }: AdminAccountDialogProps) {
  const initials = getUserInitials(user.full_name, user.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-0 gap-0 overflow-hidden">
        <div className="p-5 border-b border-border bg-secondary/30">
          <DialogHeader className="space-y-0 text-left">
            <div className="flex items-start gap-3">
              <ProfileAvatar initials={initials} size="lg" online={user.is_active} />
              <div className="min-w-0 pt-0.5">
                <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                  {user.full_name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatRole(user.role)} · Desde{" "}
                  {new Date(user.created_at).toLocaleDateString("es-CO", {
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary">
                  <Shield className="size-4" strokeWidth={2} />
                  Cuenta verificada
                </span>
              </div>
            </div>
          </DialogHeader>
        </div>

        <dl className="divide-y divide-border">
          {FIELDS.map(({ key, label, format }) => {
            const value =
              format?.(user) ??
              (key === "role_label" ? formatRole(user.role) : String(user[key as keyof AuthUser]));
            return (
              <div key={key} className="px-5 py-3.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="text-sm font-medium text-foreground mt-1 break-all">{value}</dd>
              </div>
            );
          })}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
