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

      <SidebarContent className="px-4 pt-4 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="app-sidebar-section-label px-3 mb-1 h-auto group-data-[collapsible=icon]:hidden">
            Gestión
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:gap-1">
              {nav.map((item) => {
                const active = isActive(item.to, item.exact);
                return (
                  <SidebarMenuItem key={item.to} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "h-auto rounded-r-xl border-l-[3px] tracking-tight transition-colors",
                        "px-3 py-2.5 text-[15px] gap-3",
                        "group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:border-l-0",
                        "group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-0",
                        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto",
                        "group-data-[collapsible=icon]:overflow-visible",
                        active
                          ? "border-primary bg-sidebar-accent text-sidebar-accent-foreground font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:border-transparent"
                          : "border-transparent text-muted-foreground font-medium hover:text-foreground hover:bg-secondary",
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
                          className={cn(
                            "!size-5 shrink-0 group-data-[collapsible=icon]:!size-5",
                            active && "text-primary",
                          )}
                          strokeWidth={active ? 2.35 : 2}
                        />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:px-2.5 group-data-[collapsible=icon]:py-2">
        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              onClick={onLogout}
              disabled={loggingOut}
              tooltip={loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              className={cn(
                "h-auto font-medium tracking-tight text-destructive hover:bg-destructive/10 hover:text-destructive",
                "group-data-[collapsible=icon]:rounded-xl group-data-[collapsible=icon]:!size-10",
                "group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto",
                "group-data-[collapsible=icon]:overflow-visible",
                "w-full gap-2.5 px-3 py-2.5 text-[15px] rounded-xl",
              )}
            >
              <LogOut className="!size-5 shrink-0" strokeWidth={2} />
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
