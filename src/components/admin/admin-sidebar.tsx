import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { DASHBOARD_REFRESH_EVENT } from "@/hooks/use-dashboard-animation-key";
import { BRAND_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

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
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="app-sidebar-header gap-0 p-0">
        <div className="app-sidebar-brand-row">
          <div className="app-sidebar-brand-icon" style={{ background: BRAND_GRADIENT }}>
            A
          </div>
          <div className="min-w-0 flex flex-col justify-center group-data-[collapsible=icon]:hidden">
            <p className="app-sidebar-brand-title text-gradient truncate">AdeCerebiia</p>
            <p className="app-sidebar-brand-subtitle mt-0.5">Panel Super Admin</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 pt-6 pb-3 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="app-sidebar-section-label group-data-[collapsible=icon]:hidden">
            <span>Gestión</span>
            <span className="app-sidebar-section-line" aria-hidden />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="app-sidebar-nav-menu group-data-[collapsible=icon]:gap-1">
              {nav.map((item) => {
                const active = isActive(item.to, item.exact);
                return (
                  <SidebarMenuItem key={item.to} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "app-sidebar-nav-button",
                        "data-[active=true]:!bg-transparent data-[active=true]:hover:!bg-transparent",
                        "group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border-l-0",
                        "group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0",
                        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto",
                        "group-data-[collapsible=icon]:overflow-visible",
                        active && "app-sidebar-nav-button--active",
                      )}
                    >
                      <Link
                        to={item.to}
                        className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-0"
                        onClick={() => {
                          if (active && item.to === "/admin") {
                            window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
                          }
                          onNavigate?.();
                        }}
                      >
                        <item.icon
                          className="shrink-0 group-data-[collapsible=icon]:!size-5"
                          strokeWidth={active ? 2.35 : 2}
                        />
                        <span className="app-sidebar-nav-label group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/60 px-4 py-4 group-data-[collapsible=icon]:px-2.5 group-data-[collapsible=icon]:py-2">
        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              onClick={onLogout}
              disabled={loggingOut}
              tooltip={loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              className={cn(
                "app-sidebar-nav-logout",
                "group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:!size-10",
                "group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto",
                "group-data-[collapsible=icon]:overflow-visible",
              )}
            >
              <LogOut className="shrink-0" strokeWidth={2} />
              <span className="group-data-[collapsible=icon]:hidden">
                {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
