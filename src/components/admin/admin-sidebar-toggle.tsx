import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminSidebarToggleProps = {
  open: boolean;
  onClick: () => void;
};

export function AdminSidebarToggle({ open, onClick }: AdminSidebarToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Cerrar menú lateral" : "Abrir menú lateral"}
      aria-pressed={open}
      className={cn(
        "fixed z-50 top-4 grid place-items-center size-9 rounded-xl border shadow-sm transition-[left,colors] duration-300 ease-in-out",
        open
          ? "left-3 md:left-[calc(var(--sidebar-width)-0.875rem)] border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          : "left-3 border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <PanelLeft className="size-4" strokeWidth={2} />
    </button>
  );
}
