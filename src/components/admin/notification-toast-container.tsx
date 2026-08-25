import React from "react";
import { Link } from "@tanstack/react-router";
import { X, ChevronRight, Bell } from "lucide-react";
import { useNotifications } from "@/lib/notifications/notification-store";
import { Button } from "@/components/ui/button";

export function NotificationToastContainer() {
  const { activeToast, dismissToast, markAsRead } = useNotifications();

  if (!activeToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
      <div className="rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl p-4 shadow-2xl ring-1 ring-primary/20 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <Bell className="size-4 animate-bounce" strokeWidth={2.25} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                Notificación en vivo
              </span>
              <h4 className="text-xs font-bold text-foreground leading-snug">
                {activeToast.titulo}
              </h4>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={dismissToast}
            className="size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed pl-10">
          {activeToast.mensaje}
        </p>

        {activeToast.link && (
          <div className="pt-1 pl-10 flex justify-end">
            <Link
              to={activeToast.link}
              onClick={() => {
                markAsRead(activeToast.id);
                dismissToast();
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              Ir a la sección
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
