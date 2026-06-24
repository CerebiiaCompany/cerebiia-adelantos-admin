import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { DASHBOARD_REFRESH_EVENT } from "@/hooks/use-dashboard-animation-key";
import { BRAND_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  collapsed?: boolean;
};

function SidebarTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  if (!collapsed) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="text-sm font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function AdminSidebar({
  nav,
  pathname,
  onLogout,
  loggingOut,
  onNavigate,
  collapsed = false,
}: AdminSidebarProps) {
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const navLinkClass = (active: boolean) =>
    cn(
      "relative flex items-center rounded-r-xl tracking-tight transition-colors border-l-[3px]",
      collapsed ? "justify-center px-2 py-3 w-full" : "gap-3 px-3 py-2.5 text-[15px]",
      active
        ? "border-primary bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary font-medium",
    );

  const iconClass = (active: boolean) =>
    cn("shrink-0 size-5", active && "text-primary");

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-300 ease-in-out",
          collapsed ? "w-[var(--sidebar-width-icon)]" : "w-[var(--sidebar-width)]",
        )}
      >
        <div className={cn("pt-6 pb-5", collapsed ? "px-2 flex justify-center" : "px-5")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3.5")}>
            <div
              className={cn(
                "shrink-0 rounded-xl grid place-items-center text-primary-foreground font-bold shadow-sm",
                collapsed ? "size-10 text-sm" : "size-11 text-base",
              )}
              style={{ background: BRAND_GRADIENT }}
            >
              A
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="app-sidebar-brand-title text-gradient truncate">AdeCerebiia</p>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/90 mt-0.5">
                  Panel Super Admin
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className={cn("flex-1 space-y-1.5", collapsed ? "px-1.5" : "px-3")}>
          {!collapsed && <p className="app-sidebar-section-label px-3 mb-2">Gestión</p>}
          {nav.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <SidebarTooltip key={item.to} label={item.label} collapsed={collapsed}>
                <Link
                  to={item.to}
                  onClick={() => {
                    if (active && item.to === "/admin") {
                      window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
                    }
                    onNavigate?.();
                  }}
                  className={navLinkClass(active)}
                  aria-label={collapsed ? item.label : undefined}
                >
                  <item.icon className={iconClass(active)} strokeWidth={active ? 2.35 : 2} />
                  {!collapsed && item.label}
                </Link>
              </SidebarTooltip>
            );
          })}
        </nav>

        <div className={cn("border-t border-sidebar-border", collapsed ? "p-2" : "p-4")}>
          <SidebarTooltip
            label={loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            collapsed={collapsed}
          >
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className={cn(
                "flex items-center font-medium tracking-tight text-destructive hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-60",
                collapsed
                  ? "justify-center w-full p-2.5"
                  : "w-full gap-2.5 px-3 py-2.5 text-[15px]",
              )}
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-5 shrink-0" strokeWidth={2} />
              {!collapsed && (loggingOut ? "Cerrando sesión…" : "Cerrar sesión")}
            </button>
          </SidebarTooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
