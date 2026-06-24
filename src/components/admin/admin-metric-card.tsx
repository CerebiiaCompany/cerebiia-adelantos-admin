import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type MetricIconTone = "building" | "wallet" | "trending" | "success" | "default";

type AdminMetricCardProps = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: boolean;
  iconTone?: MetricIconTone;
  className?: string;
};

const ICON_TONE: Record<
  MetricIconTone,
  { icon: string; hoverAnim: string }
> = {
  building: {
    icon: "text-info",
    hoverAnim: "kpi-icon-hover-building",
  },
  wallet: {
    icon: "text-emerald-600",
    hoverAnim: "kpi-icon-hover-wallet",
  },
  trending: {
    icon: "text-primary",
    hoverAnim: "kpi-icon-hover-trending",
  },
  success: {
    icon: "text-success",
    hoverAnim: "kpi-icon-hover-success",
  },
  default: {
    icon: "text-muted-foreground",
    hoverAnim: "",
  },
};

export function AdminMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  iconTone = "default",
  className,
}: AdminMetricCardProps) {
  const tone = ICON_TONE[iconTone];
  const useColoredIcon = iconTone !== "default" && Icon;

  return (
    <div
      className={cn(
        "admin-metric-card-interactive group",
        accent ? "admin-metric-card-accent" : "admin-metric-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4 min-w-0">
        <span
          className={cn(
            "text-xs sm:text-sm uppercase tracking-wide font-semibold leading-snug line-clamp-2 min-w-0",
            accent ? "text-primary" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {Icon && (
          <Icon
            className={cn(
              "size-6 sm:size-7 shrink-0 will-change-transform",
              useColoredIcon ? tone.icon : accent ? "text-primary" : "text-muted-foreground",
              useColoredIcon && tone.hoverAnim,
            )}
            strokeWidth={2.25}
          />
        )}
      </div>
      <div className={cn("admin-kpi-value min-w-0", accent && "text-primary")}>{value}</div>
      {sub && <div className="admin-kpi-sub">{sub}</div>}
    </div>
  );
}
