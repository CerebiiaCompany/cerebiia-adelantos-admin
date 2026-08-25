import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  Building2,
  FileSpreadsheet,
  Coins,
  Clock,
  CreditCard,
  Zap,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notifications/notification-store";
import type { NotificationType } from "@/lib/notifications/types";
import { cn } from "@/lib/utils";

function getNotificationItemIcon(tipo: NotificationType) {
  switch (tipo) {
    case "solicitud_creada":
      return <Zap className="size-4 text-blue-500 shrink-0 mt-0.5" strokeWidth={2.25} />;
    case "empresa_activa":
      return <Building2 className="size-4 text-blue-500 shrink-0 mt-0.5" strokeWidth={2.25} />;
    case "nomina_cargada":
      return <FileSpreadsheet className="size-4 text-blue-500 shrink-0 mt-0.5" strokeWidth={2.25} />;
    case "solicitud_pendiente":
      return <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={2.25} />;
    case "adelanto_sin_pago":
      return <CreditCard className="size-4 text-rose-500 shrink-0 mt-0.5" strokeWidth={2.25} />;
    default:
      return <Coins className="size-4 text-blue-500 shrink-0 mt-0.5" strokeWidth={2.25} />;
  }
}

function formatTimeAgo(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "Justo ahora";
    if (diffMin < 60) return `Hace ${diffMin} minutos`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return "Hace 1 hora";
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
  } catch {
    return "Reciente";
  }
}

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);

  const handleNotificationClick = (item: { id: string; link?: string }) => {
    // Al dar clic se elimina directamente de la bandeja
    deleteNotification(item.id);
    setOpen(false);

    if (item.link) {
      void navigate({ to: item.link });
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    void navigate({ to: "/admin/adelantos" });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative size-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 grid place-items-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
          aria-label="Notificaciones"
        >
          <Bell className="size-5" strokeWidth={2.25} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 size-2.5 rounded-full bg-blue-600 ring-2 ring-background" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[22rem] sm:w-[24rem] max-w-[calc(100vw-2rem)] rounded-3xl p-0 shadow-2xl border border-blue-100/80 dark:border-border/80 overflow-hidden bg-card/98 backdrop-blur-xl animate-in fade-in-0 zoom-in-95"
      >
        {/* HEADER EXACTO AL DISEÑO DE REFERENCIA */}
        <div className="p-5 flex items-center justify-between gap-3 border-b border-border/50">
          <div className="flex items-center gap-3.5">
            {/* Squircle azul con gradiente y campana blanca */}
            <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center shadow-md shadow-blue-500/20 shrink-0">
              <Bell className="size-6" strokeWidth={2.25} />
            </div>

            <div>
              <h3 className="font-bold text-[17px] text-foreground tracking-tight leading-snug">
                Notificaciones
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount === 0
                  ? "Bandeja al día"
                  : `${unreadCount} ${unreadCount === 1 ? "nueva sin leer" : "nuevas sin leer"}`}
              </p>
            </div>
          </div>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors shrink-0"
            >
              Marcar todo leído
            </button>
          )}
        </div>

        {/* LISTA DE NOTIFICACIONES */}
        <div className="max-h-[22rem] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 grid place-items-center mx-auto">
                <CheckCircle2 className="size-6 opacity-70" />
              </div>
              <p className="text-sm font-semibold text-foreground">Bandeja al día</p>
              <p className="text-xs text-muted-foreground">
                No hay notificaciones pendientes. Los nuevos eventos aparecerán automáticamente.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className="p-4 hover:bg-muted/40 transition-colors cursor-pointer flex items-start gap-3 group"
              >
                {/* Icono de la fila */}
                <div className="pt-0.5 shrink-0">
                  {getNotificationItemIcon(item.tipo)}
                </div>

                {/* Contenido */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-[14px] text-foreground leading-snug">
                      {item.titulo}
                    </h4>
                    {/* Punto azul de notificación activa */}
                    <span className="size-2 rounded-full bg-blue-600 shrink-0" />
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.mensaje}
                  </p>

                  <p className="text-[11px] text-muted-foreground/75 pt-0.5 font-normal">
                    {formatTimeAgo(item.fecha)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER EXACTO AL DISEÑO DE REFERENCIA */}
        <div className="p-4 border-t border-border/40 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            onClick={handleViewAll}
            className="w-full h-11 rounded-2xl border-blue-200 dark:border-blue-900 text-blue-600 hover:text-blue-700 hover:bg-blue-50/60 dark:text-blue-400 dark:hover:bg-blue-950/30 text-sm font-semibold shadow-none transition-colors"
          >
            Ver todas las notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
