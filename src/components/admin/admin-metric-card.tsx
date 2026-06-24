import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AdminMetricCardProps = {
  label: string;
  value: string;
  sub?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  className?: string;
};

export function AdminMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  className,
}: AdminMetricCardProps) {
  return (
    <div className={cn(accent ? "admin-metric-card-accent" : "admin-metric-card", className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="admin-kpi-label">{label}</span>
        {Icon && (
          <Icon
            className={cn("size-5 shrink-0", accent ? "text-primary" : "text-muted-foreground")}
          />
        )}
      </div>
      <div className={cn("admin-kpi-value", accent && "text-primary")}>{value}</div>
      {sub && <div className="admin-kpi-sub">{sub}</div>}
    </div>
  );
}
