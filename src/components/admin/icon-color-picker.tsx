import React, { useMemo, useState } from "react";
import {
  ALL_LOGRO_ICONS,
  DEFAULT_LOGRO_COLOR,
  DEFAULT_LOGRO_ICON,
  LOGRO_ICON_CATEGORIES,
  PRESET_COLORS,
  getLogroIconComponent,
} from "./logro-icon-helper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Search,
  Sparkles,
  Palette,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LogroBadgeIconProps {
  iconName: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showGlow?: boolean;
}

export function LogroBadgeIcon({
  iconName,
  color = DEFAULT_LOGRO_COLOR,
  size = "md",
  className,
  showGlow = true,
}: LogroBadgeIconProps) {
  const IconComponent = getLogroIconComponent(iconName);

  const sizeClasses = {
    sm: "size-8 rounded-lg p-1.5",
    md: "size-12 rounded-xl p-2.5",
    lg: "size-16 rounded-2xl p-3.5",
    xl: "size-20 rounded-3xl p-4",
  };

  const iconSizes = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
    xl: "size-10",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 border transition-all duration-300",
        sizeClasses[size],
        className,
      )}
      style={{
        backgroundColor: `${color}18`, // 10% opacity background
        borderColor: `${color}40`, // 25% opacity border
        boxShadow: showGlow ? `0 8px 24px -6px ${color}35` : "none",
      }}
    >
      <IconComponent
        className={cn(iconSizes[size], "transition-transform duration-300")}
        style={{ color: color }}
        strokeWidth={2.2}
      />
    </div>
  );
}

interface IconColorPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIcon: string;
  selectedColor: string;
  onSelect: (iconName: string, color: string) => void;
}

export function IconColorPickerModal({
  open,
  onOpenChange,
  selectedIcon,
  selectedColor,
  onSelect,
}: IconColorPickerModalProps) {
  const [currentIcon, setCurrentIcon] = useState(selectedIcon || DEFAULT_LOGRO_ICON);
  const [currentColor, setCurrentColor] = useState(selectedColor || DEFAULT_LOGRO_COLOR);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Sync state when opening
  React.useEffect(() => {
    if (open) {
      setCurrentIcon(selectedIcon || DEFAULT_LOGRO_ICON);
      setCurrentColor(selectedColor || DEFAULT_LOGRO_COLOR);
      setSearchQuery("");
    }
  }, [open, selectedIcon, selectedColor]);

  const filteredIcons = useMemo(() => {
    let list = ALL_LOGRO_ICONS;
    if (selectedCategory !== "all") {
      const cat = LOGRO_ICON_CATEGORIES.find((c) => c.id === selectedCategory);
      list = cat ? cat.icons : ALL_LOGRO_ICONS;
    }
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query),
    );
  }, [selectedCategory, searchQuery]);

  const handleConfirm = () => {
    onSelect(currentIcon, currentColor);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header con Vista Previa en Vivo */}
        <div className="bg-muted/40 border-b border-border p-5">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-primary" />
              Personalizar Icono y Color de la Insignia
            </DialogTitle>
            <DialogDescription className="text-xs">
              Elige el icono representativo y el color temático para este logro.
            </DialogDescription>
          </DialogHeader>

          {/* Vista previa en tiempo real */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
            <LogroBadgeIcon
              iconName={currentIcon}
              color={currentColor}
              size="lg"
              showGlow
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vista previa de la insignia
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-sm text-foreground capitalize">
                  {ALL_LOGRO_ICONS.find((i) => i.key === currentIcon)?.label || currentIcon}
                </span>
                <span
                  className="size-3 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: currentColor }}
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {currentColor.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECCIÓN 1: SELECTOR DE COLOR */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Palette className="size-3.5 text-primary" />
                Color de la insignia
              </Label>
              <span className="text-xs text-muted-foreground font-mono">
                {currentColor}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((preset) => {
                const isSelected = currentColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.label}
                    onClick={() => setCurrentColor(preset.hex)}
                    className={cn(
                      "size-8 rounded-full transition-all duration-200 relative flex items-center justify-center shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:scale-110",
                      isSelected ? "ring-2 ring-foreground ring-offset-2 scale-110" : "",
                    )}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && (
                      <Check className="size-4 text-white drop-shadow-md" strokeWidth={3} />
                    )}
                  </button>
                );
              })}

              {/* Color Picker Nativo Personalizado */}
              <div className="relative flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
                <input
                  type="color"
                  id="custom-color-picker"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="size-8 rounded-lg cursor-pointer border border-border bg-transparent p-0 overflow-hidden"
                  title="Elegir color personalizado"
                />
                <Label
                  htmlFor="custom-color-picker"
                  className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                >
                  Personalizado
                </Label>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: SELECTOR DE ICONO */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <Layers className="size-3.5 text-primary" />
                Catálogo de Iconos
              </Label>
              <div className="relative w-full sm:w-56">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar icono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-lg"
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="flex flex-wrap gap-1.5 border-b border-border pb-2.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                Todos ({ALL_LOGRO_ICONS.length})
              </button>
              {LOGRO_ICON_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Grilla de Iconos */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-56 overflow-y-auto p-1">
              {filteredIcons.map((item) => {
                const isSelected = currentIcon === item.key;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCurrentIcon(item.key)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all duration-200 group text-center",
                      isSelected
                        ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary"
                        : "bg-card border-border hover:border-primary/50 hover:bg-muted/40",
                    )}
                  >
                    <IconComp
                      className={cn(
                        "size-5 transition-transform duration-200 group-hover:scale-110",
                        isSelected ? "text-primary" : "text-foreground/80",
                      )}
                      strokeWidth={isSelected ? 2.5 : 2}
                    />
                    <span className="text-[10px] text-muted-foreground truncate w-full group-hover:text-foreground">
                      {item.label}
                    </span>
                  </button>
                );
              })}
              {filteredIcons.length === 0 && (
                <p className="col-span-full py-8 text-center text-xs text-muted-foreground">
                  No se encontraron iconos que coincidan con &quot;{searchQuery}&quot;.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex sm:justify-between items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Seleccionado:</span>
            <Badge variant="outline" className="text-[11px] gap-1 font-normal">
              {currentIcon} · {currentColor}
            </Badge>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Check className="size-4" />
              Aplicar Icono y Color
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface IconPickerButtonProps {
  iconName: string;
  color?: string;
  onClick: () => void;
  className?: string;
}

export function IconPickerButton({
  iconName,
  color = DEFAULT_LOGRO_COLOR,
  onClick,
  className,
}: IconPickerButtonProps) {
  const IconComp = getLogroIconComponent(iconName);
  const iconLabel =
    ALL_LOGRO_ICONS.find((i) => i.key === iconName)?.label || iconName;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 w-full rounded-xl border border-input bg-background/80 hover:bg-muted/40 p-2.5 transition-all text-left group hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <LogroBadgeIcon iconName={iconName} color={color} size="sm" showGlow={false} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate capitalize">
            {iconLabel}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="size-2.5 rounded-full inline-block border border-black/10 shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[11px] text-muted-foreground font-mono truncate">
              {color}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 group-hover:translate-x-0.5 transition-transform">
        <span>Cambiar</span>
        <ChevronRight className="size-3.5" />
      </div>
    </button>
  );
}
