import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AdminNotification, NotificationCategory } from "./types";
import { isSoundEnabled, playRelaxingChime, setSoundEnabled } from "./notification-sound";
import { notificationWsClient } from "./notification-websocket";
import { listSolicitudesAdmin } from "@/lib/api/adelantos";
import { listarEmpresas } from "@/lib/api/empresas";
import { isLoggedIn } from "@/lib/auth";

const NOTIFICATIONS_STORAGE_KEY = "cerebiia_admin_notifications_v2";
const DISMISSED_STORAGE_KEY = "cerebiia_admin_dismissed_notifications_v2";

interface NotificationContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  activeToast: AdminNotification | null;
  dismissToast: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  toggleSound: () => void;
  addNotification: (notification: Omit<AdminNotification, "id" | "fecha" | "leido">) => void;
  filterByCategory: (category: NotificationCategory | "all") => AdminNotification[];
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function loadStoredNotifications(): AdminNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveStoredNotifications(list: AdminNotification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    /* ignore storage quota */
  }
}

function saveDismissedIds(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    const arr = Array.from(set).slice(-500); // guardar últimas 500
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(loadStoredNotifications);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(loadDismissedIds);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(isSoundEnabled);
  const [activeToast, setActiveToast] = useState<AdminNotification | null>(null);

  // Guardar en localStorage
  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveDismissedIds(dismissedIds);
  }, [dismissedIds]);

  // Manejar llegada de una nueva notificación
  const handleIncomingNotification = useCallback(
    (notif: AdminNotification) => {
      if (dismissedIds.has(notif.id)) return;

      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });

      // Sonido relajante
      playRelaxingChime();

      // Toast emergente
      setActiveToast(notif);
    },
    [dismissedIds],
  );

  // Suscripción al WebSocket en tiempo real
  useEffect(() => {
    const unsubscribe = notificationWsClient.subscribe(handleIncomingNotification);
    return () => {
      unsubscribe();
    };
  }, [handleIncomingNotification]);

  // Sincronizar y generar notificaciones reales basadas en datos actuales del backend
  const syncWithBackendData = useCallback(async () => {
    if (!isLoggedIn()) return;

    try {
      const realNotifs: AdminNotification[] = [];

      // 1. Obtener solicitudes de adelanto
      try {
        const solRes = await listSolicitudesAdmin({ limit: 50 });
        const items = solRes?.results || [];

        for (const sol of items) {
          const montoFmt = Number(sol.monto || 0).toLocaleString("es-CO");
          const empleadoNombre = sol.empleado_nombre || "Empleado";
          const empresaNombre = sol.empresa_nombre ? ` (${sol.empresa_nombre})` : "";

          // Solicitudes pendientes de respuesta / revisión
          if (
            sol.estado === "solicitado" ||
            sol.estado === "pendiente" ||
            sol.estado === "en_revision"
          ) {
            const notifId = `sol_pend_${sol.id}`;
            if (!dismissedIds.has(notifId)) {
              realNotifs.push({
                id: notifId,
                tipo: "solicitud_creada",
                categoria: "adelantos",
                titulo: "Nueva solicitud de adelanto",
                mensaje: `${empleadoNombre}${empresaNombre} solicitó un adelanto de $${montoFmt} COP.`,
                fecha: sol.created_at || new Date().toISOString(),
                leido: false,
                link: "/admin/adelantos",
                prioridad: "alta",
                data: { solicitud_id: sol.id, monto: sol.monto },
              });
            }
          }

          // Solicitudes aprobadas sin comprobante de pago
          if (
            (sol.estado === "aprobado" || sol.estado === "aprobada") &&
            !sol.comprobante_pago
          ) {
            const notifId = `sol_pago_${sol.id}`;
            if (!dismissedIds.has(notifId)) {
              realNotifs.push({
                id: notifId,
                tipo: "adelanto_sin_pago",
                categoria: "pagos",
                titulo: "Adelanto aprobado pendiente de pago",
                mensaje: `Solicitud de ${empleadoNombre} por $${montoFmt} COP está aprobada y requiere comprobante de pago.`,
                fecha: sol.created_at || new Date().toISOString(),
                leido: false,
                link: "/admin/control-pagos",
                prioridad: "urgente",
                data: { solicitud_id: sol.id, monto: sol.monto },
              });
            }
          }
        }
      } catch {
        /* ignore api fetch errors */
      }

      // 2. Obtener empresas activas / con nómina
      try {
        const empList = await listarEmpresas();
        if (Array.isArray(empList)) {
          for (const emp of empList.slice(0, 15)) {
            // Empresa activa
            if (emp.estado === "activo" || (emp as unknown as { activo?: boolean }).activo) {
              const notifId = `emp_act_${emp.id}`;
              if (!dismissedIds.has(notifId)) {
                realNotifs.push({
                  id: notifId,
                  tipo: "empresa_activa",
                  categoria: "empresas",
                  titulo: "Empresa activa",
                  mensaje: `La empresa '${emp.nombre}' tiene su cuenta activa en la plataforma.`,
                  fecha: emp.created_at || new Date().toISOString(),
                  leido: false,
                  link: "/admin/empresas",
                  prioridad: "normal",
                  data: { empresa_id: emp.id, empresa_nombre: emp.nombre },
                });
              }
            }
          }
        }
      } catch {
        /* ignore */
      }

      // Mezclar con las existentes evitando duplicados y respetando descartadas
      setNotifications((prev) => {
        const currentNonDismissed = prev.filter((p) => !dismissedIds.has(p.id));
        const currentIds = new Set(currentNonDismissed.map((n) => n.id));

        const newlyAdded = realNotifs.filter((n) => !currentIds.has(n.id));
        if (newlyAdded.length === 0) return currentNonDismissed;

        return [...newlyAdded, ...currentNonDismissed].slice(0, 100);
      });
    } catch {
      /* ignore */
    }
  }, [dismissedIds]);

  // Cargar datos reales al montar
  useEffect(() => {
    void syncWithBackendData();
  }, [syncWithBackendData]);

  // Auto-ocultar toast después de 6 segundos
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Al dar click o marcar como leída una notificación, SE ELIMINA DIRECTAMENTE de la bandeja
  const deleteNotification = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback(
    (id: string) => {
      // Requisito usuario: Al darle click / marcar como leída, se elimina directamente de la bandeja
      deleteNotification(id);
    },
    [deleteNotification],
  );

  // Requisito usuario: Al marcar como leído todo, desaparecen todas las notificaciones de la bandeja
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const allIds = prev.map((n) => n.id);
      setDismissedIds((d) => new Set([...d, ...allIds]));
      return [];
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications((prev) => {
      const allIds = prev.map((n) => n.id);
      setDismissedIds((d) => new Set([...d, ...allIds]));
      return [];
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) playRelaxingChime(true);
      return next;
    });
  }, []);

  const addNotification = useCallback(
    (notif: Omit<AdminNotification, "id" | "fecha" | "leido">) => {
      const created: AdminNotification = {
        ...notif,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        fecha: new Date().toISOString(),
        leido: false,
      };
      handleIncomingNotification(created);
    },
    [handleIncomingNotification],
  );

  const unreadCount = useMemo(() => {
    return notifications.length;
  }, [notifications]);

  const filterByCategory = useCallback(
    (category: NotificationCategory | "all") => {
      if (category === "all") return notifications;
      return notifications.filter((n) => n.categoria === category);
    },
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      soundEnabled,
      activeToast,
      dismissToast,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      toggleSound,
      addNotification,
      filterByCategory,
      refreshNotifications: syncWithBackendData,
    }),
    [
      notifications,
      unreadCount,
      soundEnabled,
      activeToast,
      dismissToast,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      toggleSound,
      addNotification,
      filterByCategory,
      syncWithBackendData,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications debe utilizarse dentro de un NotificationProvider");
  }
  return context;
}
