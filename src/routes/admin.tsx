import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, validateSession, getStoredUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/api/types";
import { AdminStoreProvider } from "@/lib/admin-store";
import { AdminBackground } from "@/components/admin/admin-background";
import { AdminSidebar, type AdminNavItem } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { readSidebarOpenPreference, writeSidebarOpenPreference } from "@/lib/sidebar-preference";
import { cn } from "@/lib/utils";
import { Building2, History, LayoutDashboard, Settings, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav: AdminNavItem[] = [
  { to: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/adelantos", label: "Adelantos", icon: Wallet },
  { to: "/admin/historial-adelantos", label: "Historial de adelantos", icon: History },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setSidebarOpen(readSidebarOpenPreference());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (!isLoggedIn()) {
        navigate({ to: "/login" });
        return;
      }

      const sessionUser = await validateSession();
      if (cancelled) return;

      if (!sessionUser) {
        navigate({ to: "/login" });
        return;
      }

      setUser(sessionUser);
      setReady(true);
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate({ to: "/login" });
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground font-sans">
        Cargando panel…
      </div>
    );
  }

  const displayUser = user ?? getStoredUser();
  if (!displayUser) return null;

  const isSidebarVisible = isMobile ? mobileOpen : sidebarOpen;

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
      return;
    }

    setSidebarOpen((prev) => {
      const next = !prev;
      writeSidebarOpenPreference(next);
      return next;
    });
  };

  return (
    <AdminStoreProvider>
      <div className="min-h-screen flex text-foreground font-sans">
        <aside className="hidden md:flex shrink-0 fixed inset-y-0 left-0 z-40 transition-[width] duration-300 ease-in-out overflow-hidden">
          <AdminSidebar
            nav={nav}
            pathname={pathname}
            onLogout={handleLogout}
            loggingOut={loggingOut}
            collapsed={!sidebarOpen}
          />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[var(--sidebar-width)] p-0 border-border">
            <AdminSidebar
              nav={nav}
              pathname={pathname}
              onLogout={handleLogout}
              loggingOut={loggingOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex-1 min-w-0 flex flex-col min-h-screen relative transition-[margin] duration-300 ease-in-out",
            sidebarOpen
              ? "md:ml-[var(--sidebar-width)]"
              : "md:ml-[var(--sidebar-width-icon)]",
          )}
        >
          <AdminTopbar
            user={displayUser}
            onLogout={handleLogout}
            loggingOut={loggingOut}
            sidebarOpen={isSidebarVisible}
            onToggleSidebar={handleToggleSidebar}
          />

          <main className="relative flex-1">
            <AdminBackground />
            <div className="relative z-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AdminStoreProvider>
  );
}
