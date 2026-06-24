import type { LucideIcon } from "lucide-react";
import { CloudSun, MoonStar, Sunrise } from "lucide-react";

export type DayPeriod = "morning" | "afternoon" | "night";

export type TimeBasedGreeting = {
  period: DayPeriod;
  title: string;
  description: string;
  icon: LucideIcon;
  iconContainerClassName: string;
  iconClassName: string;
  iconAnimationClassName: string;
};

const GREETING_BY_PERIOD: Record<
  DayPeriod,
  Omit<TimeBasedGreeting, "period" | "title">
> = {
  morning: {
    description: "Revisa el estado de empresas y solicitudes pendientes",
    icon: Sunrise,
    iconContainerClassName: "rounded-full bg-primary/15 ring-4 ring-primary/10",
    iconClassName: "text-primary",
    iconAnimationClassName: "greeting-icon-sun-glow",
  },
  afternoon: {
    description: "Supervisa operaciones y validaciones del día",
    icon: CloudSun,
    iconContainerClassName:
      "rounded-full bg-[hsl(260_70%_55%_/_0.12)] ring-4 ring-[hsl(260_70%_55%_/_0.1)]",
    iconClassName: "text-[hsl(260_70%_50%)]",
    iconAnimationClassName: "greeting-icon-sunset-hide",
  },
  night: {
    description: "Cierra el día con el resumen de la plataforma",
    icon: MoonStar,
    iconContainerClassName: "rounded-full bg-primary/15 ring-4 ring-primary/10",
    iconClassName: "text-primary",
    iconAnimationClassName: "greeting-icon-moon-float",
  },
};

const GREETING_LABEL: Record<DayPeriod, string> = {
  morning: "Buenos días",
  afternoon: "Buenas tardes",
  night: "Buenas noches",
};

export function getDayPeriod(hour: number): DayPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "afternoon";
  return "night";
}

export function getFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "allí";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function getTimeBasedGreeting(now: Date, fullName?: string): TimeBasedGreeting {
  const period = getDayPeriod(now.getHours());
  const config = GREETING_BY_PERIOD[period];
  const firstName = getFirstName(fullName ?? "");

  return {
    period,
    title: `${GREETING_LABEL[period]}, ${firstName}`,
    ...config,
  };
}
