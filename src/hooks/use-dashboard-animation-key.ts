import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const DASHBOARD_REFRESH_EVENT = "dashboard:refresh-stats";

export function useDashboardAnimationKey() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const isDashboard = pathname === "/admin" || pathname === "/admin/";
    if (isDashboard) {
      setAnimationKey((k) => k + 1);
    }
  }, [pathname]);

  useEffect(() => {
    const handler = () => setAnimationKey((k) => k + 1);
    window.addEventListener(DASHBOARD_REFRESH_EVENT, handler);
    return () => window.removeEventListener(DASHBOARD_REFRESH_EVENT, handler);
  }, []);

  return animationKey;
}
