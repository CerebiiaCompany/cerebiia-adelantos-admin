import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  className?: string;
};

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  aside,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between w-full min-w-0",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1 className={cn("admin-title", eyebrow && "mt-1")}>{title}</h1>
        {subtitle && <p className="admin-subtitle">{subtitle}</p>}
      </div>
      {aside && (
        <div className="w-full sm:w-auto shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
          {aside}
        </div>
      )}
    </header>
  );
}
