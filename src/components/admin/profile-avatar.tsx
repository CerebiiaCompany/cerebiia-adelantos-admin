import { BRAND_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  initials: string;
  size?: "sm" | "lg";
  online?: boolean;
  className?: string;
};

export function ProfileAvatar({
  initials,
  size = "lg",
  online = true,
  className,
}: ProfileAvatarProps) {
  const isSm = size === "sm";

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "rounded-full grid place-items-center text-primary-foreground font-bold shadow-sm",
          isSm ? "size-9 text-xs ring-2 ring-card" : "size-12 text-sm",
        )}
        style={{ background: BRAND_GRADIENT }}
      >
        {initials}
      </div>
      {online && (
        <span
          className={cn(
            "absolute rounded-full bg-success border-card",
            isSm
              ? "bottom-0 right-0 size-2.5 border-[1.5px]"
              : "bottom-0.5 right-0.5 size-3 border-2",
          )}
          title="En línea"
          aria-label="En línea"
        />
      )}
    </div>
  );
}
