const SIDEBAR_OPEN_KEY = "cerebiia_sa_sidebar_open";

export function readSidebarOpenPreference(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
  if (saved === null) return true;
  return saved === "true";
}

export function writeSidebarOpenPreference(open: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIDEBAR_OPEN_KEY, String(open));
}
