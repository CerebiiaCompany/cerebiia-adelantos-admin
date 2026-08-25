import { getAccessToken } from "@/lib/auth-storage";
import { API_ORIGIN } from "@/lib/api/config";
import type { AdminNotification } from "./types";

export type NotificationCallback = (notification: AdminNotification) => void;

class NotificationWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Set<NotificationCallback> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        if (this.listeners.size > 0) {
          this.reconnect();
        }
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.listeners.size > 0) {
          if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            this.reconnect();
          }
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
    let wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let host = window.location.host;

    if (API_ORIGIN && API_ORIGIN.startsWith("http")) {
      try {
        const u = new URL(API_ORIGIN);
        host = u.host;
        wsProtocol = u.protocol === "https:" ? "wss:" : "ws:";
      } catch {
        /* fallback */
      }
    }

    return `${wsProtocol}//${host}/ws/notificaciones/?token=${encodeURIComponent(token)}`;
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
    if (!token) return;

    try {
      const wsUrl = this.getWsUrl();
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        // Enviar handshake / autenticación explícita
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
        } catch (err) {
          console.warn("[WS] Error parseando mensaje de WebSocket:", err);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = () => {
        if (this.socket) {
          try {
            this.socket.close();
          } catch {
            /* ignore */
          }
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private handleIncomingRawMessage(data: Record<string, unknown>): void {
    if (!data || typeof data !== "object") return;

    // Ignorar respuestas de heartbeat
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
      } catch (err) {
        console.error("Error en listener de notificación:", err);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.isExplicitlyClosed) return;

    // Reconexión infinita con backoff acotado a 8s
    const delay = Math.min(1000 * Math.pow(1.3, this.reconnectAttempts), 8000);
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
