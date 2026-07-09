import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AdminSidebarToggle() {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      aria-label={isOpen ? "Contraer menú lateral" : "Expandir menú lateral"}
      aria-pressed={isOpen}
      className={cn(
        "size-9 shrink-0 rounded-xl",
        isOpen
          ? "text-primary bg-primary/10 hover:bg-primary/15 hover:text-primary"
          : "text-muted-foreground hover:text-primary hover:bg-primary/10",
      )}
    >
      <PanelLeft className="size-4" strokeWidth={2} />
    </Button>
  );
}
