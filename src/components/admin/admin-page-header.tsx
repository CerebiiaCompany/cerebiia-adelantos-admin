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
        "flex items-end justify-between flex-wrap gap-4",
        className,
      )}
    >
      <div>
        {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
        <h1 className={cn("admin-title", eyebrow && "mt-1")}>{title}</h1>
        {subtitle && <p className="admin-subtitle">{subtitle}</p>}
      </div>
      {aside}
    </header>
  );
}
