import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, validateSession, getStoredUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/api/types";
import { AdminStoreProvider } from "@/lib/admin-store";
import { AdminBackground } from "@/components/admin/admin-background";
import { AdminSidebar, type AdminNavItem } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { readSidebarOpenPreference, writeSidebarOpenPreference } from "@/lib/sidebar-preference";
import {
  Building2,
  ClipboardList,
  History,
  Landmark,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav: AdminNavItem[] = [
  { to: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users },
  { to: "/admin/adelantos", label: "Adelantos", icon: Wallet },
  { to: "/admin/control-pagos", label: "Control de pagos", icon: Landmark },
  { to: "/admin/auditorias", label: "Auditorías", icon: ClipboardList },
  { to: "/admin/historial-adelantos", label: "Historial de adelantos", icon: History },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      <div className="min-h-svh grid place-items-center text-sm text-muted-foreground font-sans">
        Cargando panel…
      </div>
    );
  }

  const displayUser = user ?? getStoredUser();
  if (!displayUser) return null;

  return (
    <AdminStoreProvider>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={(open) => {
          setSidebarOpen(open);
          writeSidebarOpenPreference(open);
        }}
        className="min-h-svh"
      >
        <AdminSidebar
          nav={nav}
          pathname={pathname}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        <SidebarInset className="min-h-svh">
          <AdminTopbar user={displayUser} onLogout={handleLogout} loggingOut={loggingOut} />

          <div className="relative flex-1">
            <AdminBackground />
            <div className="relative z-10">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminStoreProvider>
  );
}
