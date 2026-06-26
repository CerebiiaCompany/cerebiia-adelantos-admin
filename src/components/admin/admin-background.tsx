import { useId } from "react";
import { cn } from "@/lib/utils";

/** Paths cerrados en y=0 y y=1440 para bucle sin costuras. */
const WAVE_PATHS = {
  back: "M0,120 C360,180 720,60 1080,120 C1260,150 1380,90 1440,120 L1440,320 L0,320 Z",
  mid: "M0,160 C360,100 720,220 1080,160 C1260,130 1380,190 1440,160 L1440,320 L0,320 Z",
  front: "M0,200 C360,140 720,260 1080,200 C1260,170 1380,230 1440,200 L1440,320 L0,320 Z",
} as const;

type WaveLayerProps = {
  path: string;
  gradId: string;
  stops: { offset: string; color: string; opacity: number }[];
  className?: string;
  duration: string;
  delay?: string;
};

function WaveLayer({ path, gradId, stops, className, duration, delay }: WaveLayerProps) {
  return (
    <div className={cn("admin-wave-layer", className)}>
      <div
        className="admin-wave-track"
        style={{ animationDuration: duration, animationDelay: delay }}
      >
        <svg
          className="admin-wave-svg"
          viewBox="0 0 2880 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="2880"
              y2="320"
            >
              {stops.map((stop) => (
                <stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </linearGradient>
          </defs>
          <path fill={`url(#${gradId})`} d={path} />
          <path fill={`url(#${gradId})`} d={path} transform="translate(1440 0)" />
        </svg>
      </div>
    </div>
  );
}

export function AdminBackground() {
  const uid = useId().replace(/:/g, "");

  return (
    <div className="admin-background pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="admin-background-sky absolute inset-0" />

      <div className="admin-waves absolute bottom-0 left-0 w-full h-[min(42vh,320px)]">
        <WaveLayer
          path={WAVE_PATHS.back}
          gradId={`admin-wave-back-${uid}`}
          className="admin-wave-layer--back"
          duration="60s"
          stops={[
            { offset: "0%", color: "hsl(230 85% 58%)", opacity: 0.09 },
            { offset: "55%", color: "hsl(250 78% 56%)", opacity: 0.11 },
            { offset: "100%", color: "hsl(265 72% 54%)", opacity: 0.08 },
          ]}
        />
        <WaveLayer
          path={WAVE_PATHS.mid}
          gradId={`admin-wave-mid-${uid}`}
          className="admin-wave-layer--mid"
          duration="45s"
          delay="-8s"
          stops={[
            { offset: "0%", color: "hsl(255 80% 56%)", opacity: 0.12 },
            { offset: "50%", color: "hsl(235 82% 54%)", opacity: 0.15 },
            { offset: "100%", color: "hsl(220 88% 52%)", opacity: 0.1 },
          ]}
        />
        <WaveLayer
          path={WAVE_PATHS.front}
          gradId={`admin-wave-front-${uid}`}
          className="admin-wave-layer--front"
          duration="36s"
          delay="-4s"
          stops={[
            { offset: "0%", color: "hsl(270 78% 58%)", opacity: 0.14 },
            { offset: "45%", color: "hsl(245 85% 55%)", opacity: 0.17 },
            { offset: "100%", color: "hsl(215 90% 54%)", opacity: 0.12 },
          ]}
        />
      </div>
    </div>
  );
}
