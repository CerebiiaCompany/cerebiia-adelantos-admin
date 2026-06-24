import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { BRAND_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

type AdminSidebarProps = {
  nav: AdminNavItem[];
  pathname: string;
  onLogout: () => void;
  loggingOut: boolean;
  onNavigate?: () => void;
};

export function AdminSidebar({
  nav,
  pathname,
  onLogout,
  loggingOut,
  onNavigate,
}: AdminSidebarProps) {
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="flex h-full w-[var(--sidebar-width)] flex-col bg-sidebar border-r border-sidebar-border">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="size-10 shrink-0 rounded-xl grid place-items-center text-primary-foreground font-bold text-sm shadow-sm"
            style={{ background: BRAND_GRADIENT }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="app-sidebar-brand-title text-gradient truncate">AdeCerebiia</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/90 mt-0.5">
              Panel Super Admin
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        <p className="app-sidebar-section-label px-3 mb-2">Gestión</p>
        {nav.map((item) => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-r-xl text-[0.8125rem] tracking-tight transition-colors border-l-[3px]",
                active
                  ? "border-primary bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary font-medium",
              )}
            >
              <item.icon
                className={cn("size-[18px] shrink-0", active ? "text-primary" : "")}
                strokeWidth={active ? 2.35 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[0.8125rem] font-medium tracking-tight text-destructive hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-60"
        >
          <LogOut className="size-[18px]" strokeWidth={2} />
          {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}
