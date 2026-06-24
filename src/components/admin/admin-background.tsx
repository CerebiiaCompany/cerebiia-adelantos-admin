import { PANEL_BG, PANEL_BG_ALT } from "@/lib/theme";

export function AdminBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${PANEL_BG} 0%, #ffffff 42%, ${PANEL_BG_ALT}55 100%)`,
        }}
      />
      <svg
        className="absolute bottom-0 left-0 w-full h-[280px] opacity-[0.35]"
        viewBox="0 0 1440 280"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="admin-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(262 80% 50%)" stopOpacity="0.12" />
            <stop offset="50%" stopColor="hsl(280 65% 55%)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(272 70% 52%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          fill="url(#admin-wave-grad)"
          d="M0,160 C240,220 480,80 720,140 C960,200 1200,100 1440,150 L1440,280 L0,280 Z"
        />
        <path
          fill="url(#admin-wave-grad)"
          opacity="0.6"
          d="M0,200 C320,120 640,240 960,180 C1120,150 1280,210 1440,190 L1440,280 L0,280 Z"
        />
      </svg>
    </div>
  );
}
