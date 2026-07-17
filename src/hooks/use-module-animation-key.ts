import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const DASHBOARD_REFRESH_EVENT = "dashboard:refresh-stats";

/**
 * Incrementa la clave de animación al entrar (o volver) a la ruta actual.
 * Usar en KPIs con AnimatedNumber para el recuento al cambiar de módulo.
 */
export function useModuleAnimationKey(listenDashboardRefresh = false) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey((k) => k + 1);
  }, [pathname]);

  useEffect(() => {
    if (!listenDashboardRefresh) return;
    const handler = () => setAnimationKey((k) => k + 1);
    window.addEventListener(DASHBOARD_REFRESH_EVENT, handler);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, handler);
  }, [listenDashboardRefresh]);

  return animationKey;
}

/** Alias del dashboard: también escucha el evento de refresh de stats. */
export function useDashboardAnimationKey() {
  return useModuleAnimationKey(true);
}
