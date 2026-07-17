import { cn } from "@/lib/utils";

/** Paths cerrados para bucle sin costuras (viewBox 1440×320, duplicado en el track). */
const WAVE_PATHS = {
  back: "M0,120 C360,180 720,60 1080,120 C1260,150 1380,90 1440,120 L1440,320 L0,320 Z",
  mid: "M0,160 C360,100 720,220 1080,160 C1260,130 1380,190 1440,160 L1440,320 L0,320 Z",
  front: "M0,200 C360,140 720,260 1080,200 C1260,170 1380,230 1440,200 L1440,320 L0,320 Z",
} as const;

type WaveLayerProps = {
  path: string;
  /** Color sólido de la ola (sin degradado interno). */
  fill: string;
  className?: string;
  duration: string;
  delay?: string;
};

function WaveLayer({ path, fill, className, duration, delay }: WaveLayerProps) {
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
          <path fill={fill} d={path} />
          <path fill={fill} d={path} transform="translate(1440 0)" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Tres olas sólidas en tonos lavanda/violeta del diseño
 * (sin bandas de color horizontales por degradado).
 */
const WAVE_COLORS = {
  back: "hsl(262 55% 92%)",
  mid: "hsl(262 50% 88%)",
  front: "hsl(262 48% 84%)",
} as const;

export function AdminBackground() {
  return (
    <div className="admin-background pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="admin-background-sky absolute inset-0" />

      <div className="admin-waves absolute bottom-0 left-0 w-full h-[min(42vh,320px)]">
        <WaveLayer
          path={WAVE_PATHS.back}
          fill={WAVE_COLORS.back}
          className="admin-wave-layer--back"
          duration="60s"
        />
        <WaveLayer
          path={WAVE_PATHS.mid}
          fill={WAVE_COLORS.mid}
          className="admin-wave-layer--mid"
          duration="45s"
          delay="-8s"
        />
        <WaveLayer
          path={WAVE_PATHS.front}
          fill={WAVE_COLORS.front}
          className="admin-wave-layer--front"
          duration="36s"
          delay="-4s"
        />
      </div>
    </div>
  );
}
