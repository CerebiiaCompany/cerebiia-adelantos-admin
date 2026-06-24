import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  className?: string;
  actions?: ReactNode;
  iconContainerClassName?: string;
  iconClassName?: string;
  iconAnimationClassName?: string;
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  className,
  actions,
  iconContainerClassName,
  iconClassName,
  iconAnimationClassName,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            iconContainerClassName ?? "border border-primary/10 bg-primary/10",
          )}
        >
          <Icon
            className={cn(
              "h-6 w-6 will-change-transform",
              iconAnimationClassName,
              iconClassName ?? "text-primary",
            )}
            strokeWidth={2.25}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <div className="text-sm text-muted-foreground">{description}</div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="w-full min-w-0 sm:w-auto sm:max-w-full sm:shrink-0 sm:self-center lg:shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
