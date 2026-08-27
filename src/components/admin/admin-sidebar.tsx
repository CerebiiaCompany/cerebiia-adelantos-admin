import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { DASHBOARD_REFRESH_EVENT } from "@/hooks/use-dashboard-animation-key";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
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
  const { setOpen, setOpenMobile } = useSidebar();
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md transition-all duration-300 flex flex-col justify-between"
    >
      {/* HEADER CON BRANDING Y CONTENEDOR ORIGINAL DEL LOGO */}
      <SidebarHeader className="p-6 pb-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:pt-3 relative overflow-hidden shrink-0">
        {/* Glow sutil en el fondo del header */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

        <div className="relative flex items-center gap-3.5 group-data-[collapsible=icon]:justify-center">
          {/* Contenedor original del logo: fondo limpio/tarjeta con borde y sombra suave */}
          <div className="size-12 group-data-[collapsible=icon]:size-10 rounded-2xl bg-card/80 dark:bg-card border border-sidebar-border/80 shadow-md p-1.5 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
            <img
              src="/favicon.png"
              alt="AdeCerebiia"
              className="size-full object-contain"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>

          <div className="min-w-0 flex flex-col justify-center group-data-[collapsible=icon]:hidden">
            <h2 className="font-extrabold text-[18px] text-[#312E81] dark:text-indigo-300 leading-tight tracking-tight">
              AdeCerebiia
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground/80 tracking-[0.16em] uppercase mt-0.5">
              Panel Super Admin
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* CONTENIDO Y NAVEGACIÓN CON DISTRIBUCIÓN EQUILIBRADA */}
      <SidebarContent className="px-4 py-2 group-data-[collapsible=icon]:px-2 flex-1 flex flex-col justify-start">
        <SidebarGroup className="p-0 space-y-4">
          {/* DIVISOR DE SECCIÓN "PRINCIPAL" */}
          <div className="flex items-center gap-3 px-2 pt-2 group-data-[collapsible=icon]:hidden">
            <span className="text-[12px] font-bold tracking-[0.18em] text-[#7C3AED] dark:text-[#A78BFA] uppercase">
              Principal
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <SidebarGroupContent>
            {/* Espaciado generoso entre módulos para ocupar armónicamente el alto */}
            <SidebarMenu className="gap-3 group-data-[collapsible=icon]:gap-2">
              {nav.map((item) => {
                const active = isActive(item.to, item.exact);
                const IconComponent = item.icon;

                return (
                  <SidebarMenuItem
                    key={item.to}
                    className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "relative h-12 w-full rounded-2xl px-4 py-3 transition-all duration-300 ease-out group/btn",
                        active
                          ? "bg-[#F3E8FF]/80 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#A78BFA] font-bold shadow-none ring-1 ring-purple-500/20"
                          : "text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 font-normal",
                        "group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
                      )}
                    >
                      <Link
                        to={item.to}
                        className="flex items-center gap-3.5 w-full group-data-[collapsible=icon]:justify-center"
                        onClick={() => {
                          if (active && item.to === "/admin") {
                            window.dispatchEvent(new CustomEvent(DASHBOARD_REFRESH_EVENT));
                          }
                          setOpen(false);
                          setOpenMobile(false);
                          onNavigate?.();
                        }}
                      >
                        {/* Barra indicadora izquierda morada para elemento activo */}
                        {active && (
                          <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-r-md bg-[#7C3AED] shadow-sm shadow-purple-500/40 group-data-[collapsible=icon]:hidden transition-all duration-300" />
                        )}

                        <IconComponent
                          className={cn(
                            "size-[22px] shrink-0 transition-all duration-300 ease-out origin-center",
                            active
                              ? "text-[#7C3AED] dark:text-[#A78BFA] scale-[1.22] drop-shadow-[0_2px_8px_rgba(124,58,237,0.35)]"
                              : "text-[#6366F1] dark:text-indigo-400 group-hover/btn:text-[#7C3AED] group-hover/btn:scale-110",
                          )}
                          strokeWidth={active ? 2.45 : 2.1}
                        />

                        {/* Nombre del módulo: negrita + morado vibrante en activo; legible y nítido en inactivo */}
                        <span
                          className={cn(
                            "text-[15px] leading-none group-data-[collapsible=icon]:hidden truncate transition-all duration-300 ease-out",
                            active
                              ? "font-extrabold text-[#7C3AED] dark:text-[#A78BFA] translate-x-0.5"
                              : "font-medium text-[#475569] dark:text-slate-200 group-hover/btn:text-slate-900 dark:group-hover/btn:text-white",
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER CON BOTÓN DE CERRAR SESIÓN */}
      <SidebarFooter className="border-t border-border/50 p-4 pb-6 group-data-[collapsible=icon]:p-2 shrink-0">
        <SidebarMenu>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              onClick={onLogout}
              disabled={loggingOut}
              tooltip={loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              className="h-12 w-full rounded-2xl px-4 py-3 text-[#EF4444] dark:text-rose-400 hover:text-red-600 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 transition-colors font-semibold group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
            >
              <LogOut className="size-[22px] shrink-0 text-[#EF4444] dark:text-rose-400" strokeWidth={2.1} />
              <span className="text-[15px] group-data-[collapsible=icon]:hidden">
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
