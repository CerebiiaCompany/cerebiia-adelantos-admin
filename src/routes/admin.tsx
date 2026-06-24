import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isLoggedIn, logout } from "@/lib/auth";
import { AdminStoreProvider } from "@/lib/admin-store";
import { LayoutDashboard, Building2, Wallet, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
  { to: "/admin/adelantos", label: "Adelantos", icon: Wallet },
];

function AdminLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoggedIn()) navigate({ to: "/login" });
    else setReady(true);
  }, [navigate]);

  if (!ready) return null;

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <AdminStoreProvider>
      <div className="min-h-screen flex bg-background text-foreground">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar p-4 gap-1">
          <div className="flex items-center gap-2 px-2 py-3 mb-4">
            <div className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground">
              <Zap className="size-3.5" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight text-sm">Adelantos · Panel</span>
          </div>

          <div className="px-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
            General
          </div>

          {nav.map((n) => {
            const active = isActive(n.to, n.exact);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                <n.icon className="size-4" />
                {n.label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}

          <div className="mt-auto border-t border-sidebar-border pt-3 space-y-2">
            <div className="px-3 py-2 text-xs">
              <div className="text-foreground font-medium">admin@panel.co</div>
              <div className="text-muted-foreground">Super-admin</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="size-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 inset-x-0 h-14 border-b border-border bg-sidebar flex items-center gap-3 px-4 z-40">
          <div className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground">
            <Zap className="size-3.5" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm">Panel</span>
          <div className="ml-auto flex gap-1">
            {nav.map((n) => {
              const active = isActive(n.to, n.exact);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`p-2 rounded-md ${active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground"}`}
                  aria-label={n.label}
                >
                  <n.icon className="size-4" />
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 min-w-0 pt-14 md:pt-0">
          <Outlet />
        </main>
      </div>
    </AdminStoreProvider>
  );
}
