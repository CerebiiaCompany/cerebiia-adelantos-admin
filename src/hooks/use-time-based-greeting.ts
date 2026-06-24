import { useEffect, useMemo, useState } from "react";
import { getTimeBasedGreeting, type TimeBasedGreeting } from "@/lib/time-based-greeting";

const REFRESH_INTERVAL_MS = 60_000;

export function useTimeBasedGreeting(fullName?: string): TimeBasedGreeting {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  return useMemo(() => getTimeBasedGreeting(now, fullName), [now, fullName]);
}
