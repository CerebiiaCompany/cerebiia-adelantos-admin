import { NOTIFICATION_SOUND_BASE64 } from "./sound-base64";

/**
 * Motor de sonido robusto multi-estrategia para notificaciones del Super Admin.
 * Combina Audio Element con data URI (sin dependencias de red), archivo WAV y Web Audio API.
 */

const SOUND_STORAGE_KEY = "cerebiia_admin_sound_enabled";

let cachedAudioElement: HTMLAudioElement | null = null;
let audioUnlocked = false;

function getOrCreateAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!cachedAudioElement) {
    try {
      cachedAudioElement = new Audio(NOTIFICATION_SOUND_BASE64);
      cachedAudioElement.preload = "auto";
      cachedAudioElement.volume = 0.85;
    } catch {
      try {
        cachedAudioElement = new Audio("/sounds/notification.wav");
        cachedAudioElement.preload = "auto";
        cachedAudioElement.volume = 0.85;
      } catch {
        cachedAudioElement = null;
      }
    }
  }
  return cachedAudioElement;
}

/**
 * Desbloquea el audio del navegador en cualquier interacción del usuario
 */
export function unlockAudio(): void {
  if (audioUnlocked || typeof window === "undefined") return;

  const doUnlock = () => {
    const audio = getOrCreateAudio();
    if (audio) {
      // Intento de desbloqueo con volumen 0 para no sonar
      const prevVol = audio.volume;
      audio.volume = 0.01;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = prevVol;
            audioUnlocked = true;
          })
          .catch(() => {
            audio.volume = prevVol;
          });
      }
    }

    window.removeEventListener("click", doUnlock);
    window.removeEventListener("pointerdown", doUnlock);
    window.removeEventListener("keydown", doUnlock);
    window.removeEventListener("touchstart", doUnlock);
  };

  window.addEventListener("click", doUnlock, { passive: true });
  window.addEventListener("pointerdown", doUnlock, { passive: true });
  window.addEventListener("keydown", doUnlock, { passive: true });
  window.addEventListener("touchstart", doUnlock, { passive: true });
}

if (typeof window !== "undefined") {
  unlockAudio();
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val !== "false";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Reproduce el sonido de alerta relajante y claro.
 * @param force Si es true, ignora el estado de silencio para hacer pruebas manuales de sonido.
 */
export function playRelaxingChime(force = false): void {
  if (!force && !isSoundEnabled()) return;
  if (typeof window === "undefined") return;

  try {
    const audio = getOrCreateAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.85;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Fallback a Web Audio API sintetizado
          fallbackWebAudioChime();
        });
        return;
      }
    }
  } catch {
    fallbackWebAudioChime();
  }
}

/**
 * Fallback procedural usando Web Audio API si HTML5 Audio fuese bloqueado
 */
function fallbackWebAudioChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, time: 0, duration: 1.0, gain: 0.3 },
      { freq: 880.0, time: 0.12, duration: 1.3, gain: 0.35 },
    ];

    notes.forEach(({ freq, time, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);

      const startTime = now + time;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch {
    /* ignore */
  }
}
