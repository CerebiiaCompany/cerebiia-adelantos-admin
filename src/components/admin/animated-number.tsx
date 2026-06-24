import { formatCOP } from "@/lib/admin-store";
import { useCountUp, usePrefersReducedMotion } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number;
  format?: "number" | "currency";
  animationKey?: number;
  className?: string;
  duration?: number;
  delay?: number;
};

export function AnimatedNumber({
  value,
  format = "number",
  animationKey = 0,
  className,
  duration,
  delay,
}: AnimatedNumberProps) {
  const reducedMotion = usePrefersReducedMotion();
  const animated = useCountUp(value, {
    animationKey,
    duration,
    delay,
    enabled: !reducedMotion,
  });

  const text =
    format === "currency"
      ? formatCOP(animated)
      : animated.toLocaleString("es-CO", { maximumFractionDigits: 0 });

  return <span className={cn("tabular-nums", className)}>{text}</span>;
}
