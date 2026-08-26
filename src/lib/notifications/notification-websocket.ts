import { getAccessToken } from "@/lib/auth-storage";
import { WS_BASE_URL } from "@/lib/api/config";
import type { AdminNotification } from "./types";

export type NotificationCallback = (notification: AdminNotification) => void;
export type StatusCallback = (connected: boolean) => void;

const RETRY_DELAYS = [5000, 10000, 20000, 30000];

class NotificationWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Set<NotificationCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;
  private connected = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        if (this.listeners.size > 0 && !this.isConnected()) {
          this.reconnect();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.listeners.size > 0) {
          if (!this.isConnected()) {
            this.reconnect();
          }
        }
      });
    }
  }

  public isConnected(): boolean {
    return Boolean(this.socket && this.socket.readyState === WebSocket.OPEN);
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.isConnected());
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyStatus(status: boolean): void {
    if (this.connected !== status) {
      this.connected = status;
      this.statusListeners.forEach((cb) => {
        try {
          cb(status);
        } catch {
          /* ignore */
        }
      });
    }
  }

  public subscribe(callback: NotificationCallback): () => void {
    this.listeners.add(callback);
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  public getWsUrl(): string {
    const token = getAccessToken() || "";
    return `${WS_BASE_URL}/ws/notificaciones/?token=${encodeURIComponent(token)}`;
  }

  public connect(): void {
    if (typeof window === "undefined") return;
    this.isExplicitlyClosed = false;

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      this.notifyStatus(false);
      return;
    }

    try {
      const wsUrl = this.getWsUrl();
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyStatus(true);
        this.startHeartbeat();

        // Handshake explícito
        try {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: "authenticate", token }));
            this.socket.send(JSON.stringify({ type: "auth", token }));
          }
        } catch {
          /* ignore */
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const raw = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          this.handleIncomingRawMessage(raw);
        } catch {
          /* silencioso para evitar spam */
        }
      };

      this.socket.onclose = () => {
        this.notifyStatus(false);
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        // Envolver onerror para no emitir ráfagas de logs repetitivos
        this.notifyStatus(false);
        if (this.socket) {
          try {
            this.socket.close();
          } catch {
            /* ignore */
          }
        }
      };
    } catch {
      this.notifyStatus(false);
      this.scheduleReconnect();
    }
  }

  private handleIncomingRawMessage(data: Record<string, unknown>): void {
    if (!data || typeof data !== "object") return;

    if (data.type === "pong" || data.type === "heartbeat" || data.action === "pong") {
      return;
    }

    // 1. Wrapper { payload: { ... } }
    if (data.payload && typeof data.payload === "object") {
      this.emit(data.payload as AdminNotification);
      return;
    }

    // 2. Wrapper { data: { ... } }
    if (data.data && typeof data.data === "object") {
      const inner = data.data as Record<string, unknown>;
      if (inner.titulo || inner.mensaje || inner.monto || inner.id) {
        this.emit(this.normalizeNotification(inner, (data.type || data.event || data.action) as string));
        return;
      }
    }

    // 3. Wrapper { notificacion: { ... } }
    if (data.notificacion && typeof data.notificacion === "object") {
      this.emit(data.notificacion as AdminNotification);
      return;
    }

    // 4. Formato plano o evento
    if (data.titulo || data.mensaje || data.title || data.message || data.tipo || data.event || data.solicitud_id) {
      this.emit(this.normalizeNotification(data));
    }
  }

  private normalizeNotification(
    data: Record<string, unknown>,
    fallbackType?: string,
  ): AdminNotification {
    const tipo = (data.tipo || data.type || data.event || fallbackType || "sistema_info") as string;
    const titulo = (data.titulo || data.title || "Nueva notificación") as string;
    const mensaje = (data.mensaje || data.message || data.descripcion || "") as string;
    const id = (data.id as string) || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const fecha = (data.fecha || data.created_at || new Date().toISOString()) as string;
    const link = (data.link || data.url || "/admin/adelantos") as string;

    let categoria = (data.categoria || "sistema") as AdminNotification["categoria"];
    if (tipo.includes("solicitud") || tipo.includes("adelanto")) {
      categoria = "adelantos";
    } else if (tipo.includes("empresa")) {
      categoria = "empresas";
    } else if (tipo.includes("pago") || tipo.includes("comprobante")) {
      categoria = "pagos";
    }

    return {
      id,
      tipo: tipo as AdminNotification["tipo"],
      categoria,
      titulo,
      mensaje,
      fecha,
      leido: Boolean(data.leido),
      link,
      data: (data.data || data) as Record<string, unknown>,
      prioridad: (data.prioridad || "normal") as AdminNotification["prioridad"],
    };
  }

  public reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.notifyStatus(false);
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        /* ignore */
      }
      this.socket = null;
    }
  }

  private emit(notification: AdminNotification): void {
    const validNotif: AdminNotification = {
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tipo: notification.tipo || "sistema_info",
      categoria: notification.categoria || "sistema",
      titulo: notification.titulo || "Nueva notificación",
      mensaje: notification.mensaje || "",
      fecha: notification.fecha || new Date().toISOString(),
      leido: Boolean(notification.leido),
      link: notification.link,
      data: notification.data,
      prioridad: notification.prioridad || "normal",
    };

    this.listeners.forEach((callback) => {
      try {
        callback(validNotif);
      } catch {
        /* ignore */
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.isExplicitlyClosed) return;

    // Backoff progresivo: 1er intento en 5s, luego 10s, 20s, hasta máx 30s
    const delay = RETRY_DELAYS[Math.min(this.reconnectAttempts, RETRY_DELAYS.length - 1)];
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isExplicitlyClosed && this.listeners.size > 0) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: "ping" }));
        } catch {
          /* ignore */
        }
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const notificationWsClient = new NotificationWebSocketClient();
