import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type MetricIconTone = "building" | "wallet" | "trending" | "success" | "default";

type AdminMetricCardProps = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  subtext?: ReactNode;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: boolean;
  iconTone?: MetricIconTone;
  className?: string;
};

const ICON_TONE: Record<
  MetricIconTone,
  { icon: string; bg: string; hoverAnim: string }
> = {
  building: {
    icon: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    hoverAnim: "kpi-icon-hover-building",
  },
  wallet: {
    icon: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    hoverAnim: "kpi-icon-hover-wallet",
  },
  trending: {
    icon: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    hoverAnim: "kpi-icon-hover-trending",
  },
  success: {
    icon: "text-success",
    bg: "bg-success/10 border-success/20",
    hoverAnim: "kpi-icon-hover-success",
  },
  default: {
    icon: "text-muted-foreground",
    bg: "bg-muted/60 border-border/50",
    hoverAnim: "",
  },
};

export function AdminMetricCard({
  label,
  value,
  sub,
  subtext,
  icon: Icon,
  accent,
  iconTone = "default",
  className,
}: AdminMetricCardProps) {
  const tone = ICON_TONE[iconTone];
  const useColoredIcon = iconTone !== "default" && Icon;
  const subtitle = sub ?? subtext;

  return (
    <div
      className={cn(
        "admin-metric-card-interactive group relative overflow-hidden",
        accent ? "admin-metric-card-accent" : "admin-metric-card",
        className,
      )}
    >
      {/* MARCA DE AGUA: Icono grande y tenue en la esquina inferior derecha */}
      {Icon && (
        <div
          className="absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-3 pointer-events-none select-none text-primary/[0.04] dark:text-primary/[0.06] transition-all duration-500 ease-out group-hover:scale-110 group-hover:text-primary/[0.075] dark:group-hover:text-primary/[0.10]"
          aria-hidden="true"
        >
          <Icon className="size-16 sm:size-24 md:size-28" strokeWidth={1.25} />
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-4 min-w-0">
          <span
            className={cn(
              "text-[10px] sm:text-xs uppercase tracking-wide font-semibold leading-tight line-clamp-2 min-w-0",
              accent ? "text-primary" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
          {Icon && (
            <div
              className={cn(
                "size-7 sm:size-9 rounded-xl sm:rounded-2xl grid place-items-center shrink-0 border transition-transform duration-300 group-hover:scale-105",
                accent
                  ? "bg-primary/10 text-primary border-primary/25"
                  : useColoredIcon
                  ? cn(tone.bg, tone.icon)
                  : "bg-primary/10 text-primary border-primary/15",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 sm:size-4.5 will-change-transform",
                  useColoredIcon ? tone.icon : accent ? "text-primary" : "text-primary",
                  useColoredIcon && tone.hoverAnim,
                )}
                strokeWidth={2}
              />
            </div>
          )}
        </div>
        <div className={cn("admin-kpi-value min-w-0", accent && "text-primary")}>{value}</div>
        {subtitle && <div className="admin-kpi-sub">{subtitle}</div>}
      </div>
    </div>
  );
}
