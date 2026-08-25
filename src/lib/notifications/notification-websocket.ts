import { getAccessToken } from "@/lib/auth-storage";
import { API_ORIGIN } from "@/lib/api/config";
import type { AdminNotification, WebSocketNotificationMessage } from "./types";

export type NotificationCallback = (notification: AdminNotification) => void;

class NotificationWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Set<NotificationCallback> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isExplicitlyClosed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;

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
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let host = window.location.host;

      if (API_ORIGIN && API_ORIGIN.startsWith("http")) {
        try {
          const u = new URL(API_ORIGIN);
          host = u.host;
        } catch {
          /* fallback */
        }
      }

      const wsUrl = `${wsProtocol}//${host}/ws/notificaciones/?token=${encodeURIComponent(token)}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketNotificationMessage | AdminNotification;

          // Si es un formato envuelto
          if ("type" in data && data.type === "notification" && data.payload) {
            const notif = data.payload as AdminNotification;
            this.emit(notif);
          } else if ("tipo" in data && "titulo" in data) {
            this.emit(data as AdminNotification);
          }
        } catch {
          /* ignorar mensajes no json */
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
          this.socket.close();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
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
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
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
        this.socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const notificationWsClient = new NotificationWebSocketClient();
