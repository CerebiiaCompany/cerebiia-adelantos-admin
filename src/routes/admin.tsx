import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, validateSession, getStoredUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/api/types";
import { AdminStoreProvider } from "@/lib/admin-store";
import { NotificationProvider } from "@/lib/notifications/notification-store";
import { NotificationToastContainer } from "@/components/admin/notification-toast-container";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AdminBackground } from "@/components/admin/admin-background";

/** Límite de inactividad de sesión (15 minutos = 900.000 ms - SEG-03) */
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const LAST_ACTIVITY_KEY = "cerebiia_admin_last_activity";
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
  Trophy,
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
  { to: "/admin/logros", label: "Logros", icon: Trophy },
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

  // Política de inactividad de sesión (SEG-03: cierre automático tras 15 min de inactividad)
  useEffect(() => {
    if (!ready || !user) return;

    let lastThrottled = Date.now();
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    } catch {}

    const registerActivity = () => {
      const now = Date.now();
      if (now - lastThrottled > 2000) {
        lastThrottled = now;
        try {
          localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        } catch {}
      }
    };

    const checkInactivity = async () => {
      let last = lastThrottled;
      try {
        const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (stored) {
          const parsed = Number(stored);
          if (Number.isFinite(parsed)) last = Math.max(last, parsed);
        }
      } catch {}

      const elapsed = Date.now() - last;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        toast.error("Tu sesión ha expirado por 15 minutos de inactividad.");
        setLoggingOut(true);
        try {
          await logout();
        } finally {
          navigate({ to: "/login" });
        }
      }
    };

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkInactivity();
      }
    };

    window.addEventListener("mousemove", registerActivity, { passive: true });
    window.addEventListener("mousedown", registerActivity, { passive: true });
    window.addEventListener("keydown", registerActivity, { passive: true });
    window.addEventListener("touchstart", registerActivity, { passive: true });
    window.addEventListener("scroll", registerActivity, { passive: true });
    window.addEventListener("click", registerActivity, { passive: true });
    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    const interval = window.setInterval(checkInactivity, 15_000);

    return () => {
      window.removeEventListener("mousemove", registerActivity);
      window.removeEventListener("mousedown", registerActivity);
      window.removeEventListener("keydown", registerActivity);
      window.removeEventListener("touchstart", registerActivity);
      window.removeEventListener("scroll", registerActivity);
      window.removeEventListener("click", registerActivity);
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
      window.clearInterval(interval);
    };
  }, [ready, user, navigate]);

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
    <NotificationProvider>
      <AdminStoreProvider>
        <SidebarProvider
          open={sidebarOpen}
          onOpenChange={(open) => {
            setSidebarOpen(open);
            writeSidebarOpenPreference(open);
          }}
          className="min-h-svh max-w-full overflow-x-clip w-full"
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
      <NotificationToastContainer />
      <Toaster position="top-right" richColors />
    </NotificationProvider>
  );
}
