export type NotificationCategory =
  | "adelantos"
  | "empresas"
  | "pagos"
  | "sistema";

export type NotificationType =
  | "empresa_activa" // Una empresa activa su cuenta (configura su clave)
  | "nomina_cargada" // Una empresa sube/agrega su nómina
  | "solicitud_creada" // Un empleado realiza una solicitud de adelanto
  | "solicitud_pendiente" // Una solicitud no se ha respondido / en espera
  | "adelanto_sin_pago" // Adelanto aprobado pero aún no se ha subido/enviado el comprobante de pago
  | "sistema_info"; // Información general

export interface AdminNotification {
  id: string;
  tipo: NotificationType;
  categoria: NotificationCategory;
  titulo: string;
  mensaje: string;
  fecha: string; // ISO 8601 string
  leido: boolean;
  link?: string; // Ruta de navegación (ej. "/admin/adelantos?id=...", "/admin/empresas")
  data?: Record<string, unknown>; // Metadatos adicionales (monto, empresa_nombre, etc.)
  prioridad?: "baja" | "normal" | "alta" | "urgente";
}

export interface WebSocketNotificationMessage {
  type: "notification" | "heartbeat" | "init" | "pong";
  event?: NotificationType;
  payload?: Partial<AdminNotification>;
}
