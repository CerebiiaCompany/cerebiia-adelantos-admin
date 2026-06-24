import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdminSidebarToggleProps = {
  open: boolean;
  onClick: () => void;
};

export function AdminSidebarToggle({ open, onClick }: AdminSidebarToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={open ? "Contraer menú lateral" : "Expandir menú lateral"}
      aria-pressed={open}
      className={cn(
        "size-9 shrink-0 rounded-xl",
        open
          ? "text-primary bg-primary/10 hover:bg-primary/15 hover:text-primary"
          : "text-muted-foreground hover:text-primary hover:bg-primary/10",
      )}
    >
      <PanelLeft className="size-4" strokeWidth={2} />
    </Button>
  );
}
