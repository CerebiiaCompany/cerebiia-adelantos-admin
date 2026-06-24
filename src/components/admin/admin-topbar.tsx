import { useState } from "react";
import { AdminSidebarToggle } from "@/components/admin/admin-sidebar-toggle";
import { AdminAccountDialog } from "@/components/admin/admin-account-dialog";
import { ProfileAvatar } from "@/components/admin/profile-avatar";
import { Bell, ChevronRight, LogOut, Shield } from "lucide-react";
import type { AuthUser } from "@/lib/api/types";
import { SUPER_ADMIN_ROLE } from "@/lib/api/types";
import { BRAND_GRADIENT, getUserInitials } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminTopbarProps = {
  user: AuthUser;
  onLogout: () => void;
  loggingOut: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

const PROFILE_MENU_ITEMS = [
  { id: "account", label: "Ver mi cuenta" },
  { id: "settings", label: "Configuración" },
  { id: "privacy", label: "Privacidad" },
  { id: "terms", label: "Términos y condiciones" },
] as const;

function formatMemberSince(createdAt: string) {
  const formatted = new Date(createdAt).toLocaleDateString("es-CO", {
    month: "short",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatRole(role: string) {
  if (role === SUPER_ADMIN_ROLE) return "Super Administrador";
  return role.replace(/_/g, " ");
}

export function AdminTopbar({
  user,
  onLogout,
  loggingOut,
  sidebarOpen,
  onToggleSidebar,
}: AdminTopbarProps) {
  const initials = getUserInitials(user.full_name, user.email);
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOnline = user.is_active;

  const handleMenuAction = (id: (typeof PROFILE_MENU_ITEMS)[number]["id"]) => {
    if (id === "account") {
      setMenuOpen(false);
      setAccountOpen(true);
    }
  };

  return (
    <>
      <header className="app-shell-header justify-between gap-2 px-4 md:px-8">
        <AdminSidebarToggle open={sidebarOpen} onClick={onToggleSidebar} />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
            aria-label="Notificaciones"
          >
            <Bell className="size-[18px]" strokeWidth={2} />
          </Button>

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="size-9 rounded-full grid place-items-center text-primary-foreground text-xs font-semibold shadow-sm ring-2 ring-card hover:opacity-90 transition-opacity"
                style={{ background: BRAND_GRADIENT }}
                aria-label="Menú de perfil"
              >
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-[17.5rem] rounded-2xl p-0 shadow-lg border border-border/80 overflow-hidden"
            >
              <div className="p-4 border-b border-border/80">
                <div className="flex items-start gap-3">
                  <ProfileAvatar initials={initials} size="lg" online={isOnline} />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-base font-semibold text-foreground leading-snug truncate">
                      {user.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatRole(user.role)} · Desde {formatMemberSince(user.created_at)}
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary">
                      <Shield className="size-4" strokeWidth={2} />
                      Cuenta verificada
                    </span>
                  </div>
                </div>
              </div>

              <div className="py-1">
                {PROFILE_MENU_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMenuAction(item.id)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-[15px] font-medium text-foreground hover:bg-muted/50 transition-colors border-b border-border/60 last:border-b-0"
                  >
                    {item.label}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/45" strokeWidth={2} />
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-border/80">
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-3 py-3 text-[15px] font-semibold text-destructive hover:bg-destructive/15 transition-colors disabled:opacity-60"
                >
                  <LogOut className="size-4" strokeWidth={2.25} />
                  {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AdminAccountDialog user={user} open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  );
}
