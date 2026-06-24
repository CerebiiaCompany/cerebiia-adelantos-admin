import {
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  User,
  FileText,
} from "lucide-react";
import type { AuthUser } from "@/lib/api/types";
import { BRAND_GRADIENT, getUserInitials } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminTopbarProps = {
  user: AuthUser;
  onLogout: () => void;
  loggingOut: boolean;
};

export function AdminTopbar({ user, onLogout, loggingOut }: AdminTopbarProps) {
  const initials = getUserInitials(user.full_name, user.email);

  return (
    <header className="app-shell-header justify-end gap-2 px-4 md:px-8">
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

        <DropdownMenu>
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
          <DropdownMenuContent align="end" className="w-72 rounded-2xl p-0 shadow-lg border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-start gap-3">
                <div
                  className="size-11 shrink-0 rounded-full grid place-items-center text-primary-foreground text-sm font-semibold"
                  style={{ background: BRAND_GRADIENT }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-foreground truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <p className="text-xs text-accent font-medium mt-0.5">Super Administrador</p>
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Shield className="size-3" />
                    Cuenta verificada
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2">
              <DropdownMenuItem className="rounded-xl cursor-pointer justify-between text-foreground">
                <span className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  Ver mi cuenta
                </span>
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl cursor-pointer justify-between text-foreground">
                <span className="flex items-center gap-2 text-sm">
                  <Settings className="size-4 text-muted-foreground" />
                  Configuración
                </span>
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl cursor-pointer justify-between text-foreground">
                <span className="flex items-center gap-2 text-sm">
                  <Shield className="size-4 text-muted-foreground" />
                  Privacidad
                </span>
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl cursor-pointer justify-between text-foreground">
                <span className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  Términos y condiciones
                </span>
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator />

            <div className="p-2">
              <button
                type="button"
                onClick={onLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/15 transition-colors disabled:opacity-60"
              >
                <LogOut className="size-4" />
                {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
