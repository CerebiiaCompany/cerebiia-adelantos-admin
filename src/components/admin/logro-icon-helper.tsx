import React from "react";
import {
  Trophy,
  Award,
  Medal,
  Crown,
  Star,
  Sparkles,
  Flame,
  Zap,
  Rocket,
  Target,
  Heart,
  Gem,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Banknote,
  Coins,
  DollarSign,
  CreditCard,
  TrendingUp,
  PiggyBank,
  BadgePercent,
  Landmark,
  CircleDollarSign,
  Receipt,
  Calendar,
  Clock,
  Timer,
  CheckSquare,
  ListTodo,
  Compass,
  Flag,
  Smile,
  ThumbsUp,
  Gift,
  Sun,
  Moon,
  Lock,
  Key,
  ShieldAlert,
  UserCheck,
  Briefcase,
  Building2,
  Users,
  PartyPopper,
  Sparkle,
  Bookmark,
  Bell,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export type IconCategory = {
  id: string;
  name: string;
  icons: Array<{ key: string; label: string; icon: LucideIcon }>;
};

export const LOGRO_ICON_CATEGORIES: IconCategory[] = [
  {
    id: "premios",
    name: "Premios & Logros",
    icons: [
      { key: "trophy", label: "Trofeo", icon: Trophy },
      { key: "award", label: "Premio", icon: Award },
      { key: "medal", label: "Medalla", icon: Medal },
      { key: "crown", label: "Corona", icon: Crown },
      { key: "star", label: "Estrella", icon: Star },
      { key: "sparkles", label: "Destellos", icon: Sparkles },
      { key: "flame", label: "Fuego", icon: Flame },
      { key: "zap", label: "Rayo", icon: Zap },
      { key: "rocket", label: "Cohete", icon: Rocket },
      { key: "target", label: "Diana / Meta", icon: Target },
      { key: "gem", label: "Diamante", icon: Gem },
      { key: "party-popper", label: "Celebración", icon: PartyPopper },
    ],
  },
  {
    id: "finanzas",
    name: "Finanzas & Dinero",
    icons: [
      { key: "wallet", label: "Billetera", icon: Wallet },
      { key: "banknote", label: "Billete", icon: Banknote },
      { key: "coins", label: "Monedas", icon: Coins },
      { key: "dollar-sign", label: "Dólar", icon: DollarSign },
      { key: "credit-card", label: "Tarjeta", icon: CreditCard },
      { key: "trending-up", label: "Crecimiento", icon: TrendingUp },
      { key: "piggy-bank", label: "Alcancía", icon: PiggyBank },
      { key: "badge-percent", label: "Porcentaje", icon: BadgePercent },
      { key: "landmark", label: "Banco", icon: Landmark },
      { key: "circle-dollar-sign", label: "Moneda", icon: CircleDollarSign },
      { key: "receipt", label: "Recibo", icon: Receipt },
    ],
  },
  {
    id: "metas",
    name: "Hábitos & Metas",
    icons: [
      { key: "calendar", label: "Calendario", icon: Calendar },
      { key: "clock", label: "Reloj", icon: Clock },
      { key: "timer", label: "Temporizador", icon: Timer },
      { key: "check-circle", label: "Completado", icon: CheckCircle2 },
      { key: "check-square", label: "Casilla", icon: CheckSquare },
      { key: "list-todo", label: "Lista", icon: ListTodo },
      { key: "compass", label: "Brújula", icon: Compass },
      { key: "flag", label: "Bandera", icon: Flag },
      { key: "thumbs-up", label: "Me gusta", icon: ThumbsUp },
      { key: "smile", label: "Felicidad", icon: Smile },
      { key: "heart", label: "Corazón", icon: Heart },
      { key: "gift", label: "Regalo", icon: Gift },
      { key: "sun", label: "Sol", icon: Sun },
      { key: "moon", label: "Luna", icon: Moon },
    ],
  },
  {
    id: "seguridad",
    name: "Seguridad & Confianza",
    icons: [
      { key: "shield", label: "Escudo", icon: Shield },
      { key: "shield-check", label: "Seguro", icon: ShieldCheck },
      { key: "lock", label: "Candado", icon: Lock },
      { key: "key", label: "Llave", icon: Key },
      { key: "user-check", label: "Usuario verificado", icon: UserCheck },
      { key: "briefcase", label: "Portafolio", icon: Briefcase },
      { key: "building", label: "Empresa", icon: Building2 },
      { key: "users", label: "Equipo", icon: Users },
      { key: "bookmark", label: "Guardado", icon: Bookmark },
      { key: "bell", label: "Campana", icon: Bell },
    ],
  },
];

export const ALL_LOGRO_ICONS = LOGRO_ICON_CATEGORIES.flatMap((c) => c.icons);

export const LOGRO_ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  award: Award,
  medal: Medal,
  crown: Crown,
  star: Star,
  sparkles: Sparkles,
  sparkle: Sparkle,
  flame: Flame,
  zap: Zap,
  rocket: Rocket,
  target: Target,
  heart: Heart,
  gem: Gem,
  shield: Shield,
  "shield-check": ShieldCheck,
  "check-circle": CheckCircle2,
  wallet: Wallet,
  banknote: Banknote,
  coins: Coins,
  "dollar-sign": DollarSign,
  "credit-card": CreditCard,
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
  "badge-percent": BadgePercent,
  landmark: Landmark,
  "circle-dollar-sign": CircleDollarSign,
  receipt: Receipt,
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  "check-square": CheckSquare,
  "list-todo": ListTodo,
  compass: Compass,
  flag: Flag,
  smile: Smile,
  "thumbs-up": ThumbsUp,
  gift: Gift,
  sun: Sun,
  moon: Moon,
  lock: Lock,
  key: Key,
  "shield-alert": ShieldAlert,
  "user-check": UserCheck,
  briefcase: Briefcase,
  building: Building2,
  users: Users,
  "party-popper": PartyPopper,
  bookmark: Bookmark,
  bell: Bell,
  milestone5: Medal,
  adelanto_count: Coins,
  primera_vez: Sparkles,
};

export const PRESET_COLORS = [
  { hex: "#9333EA", label: "Violeta Cerebiia", bg: "bg-purple-500", border: "border-purple-500/30" },
  { hex: "#2563EB", label: "Azul Eléctrico", bg: "bg-blue-600", border: "border-blue-500/30" },
  { hex: "#10B981", label: "Verde Esmeralda", bg: "bg-emerald-500", border: "border-emerald-500/30" },
  { hex: "#F59E0B", label: "Dorado Ámbar", bg: "bg-amber-500", border: "border-amber-500/30" },
  { hex: "#EF4444", label: "Rojo Carmesí", bg: "bg-rose-500", border: "border-rose-500/30" },
  { hex: "#EC4899", label: "Rosa Neón", bg: "bg-pink-500", border: "border-pink-500/30" },
  { hex: "#06B6D4", label: "Cian Océano", bg: "bg-cyan-500", border: "border-cyan-500/30" },
  { hex: "#F97316", label: "Naranja Fuego", bg: "bg-orange-500", border: "border-orange-500/30" },
  { hex: "#6366F1", label: "Índigo Real", bg: "bg-indigo-500", border: "border-indigo-500/30" },
  { hex: "#0D9488", label: "Verde Azulado", bg: "bg-teal-600", border: "border-teal-500/30" },
  { hex: "#84CC16", label: "Verde Lima", bg: "bg-lime-500", border: "border-lime-500/30" },
  { hex: "#475569", label: "Pizarra Titanio", bg: "bg-slate-600", border: "border-slate-500/30" },
];

export const DEFAULT_LOGRO_COLOR = "#9333EA";
export const DEFAULT_LOGRO_ICON = "trophy";

/**
 * Descompone un `icon_key` en su nombre de icono y color hex (si contiene `icon:color` o `icon|color`).
 */
export function parseIconKey(raw?: string): { iconName: string; color: string } {
  if (!raw || typeof raw !== "string") {
    return { iconName: DEFAULT_LOGRO_ICON, color: DEFAULT_LOGRO_COLOR };
  }
  const parts = raw.split(/[:|]/);
  const iconName = parts[0]?.trim().toLowerCase() || DEFAULT_LOGRO_ICON;
  const color = parts[1]?.trim() || DEFAULT_LOGRO_COLOR;
  return { iconName, color };
}

/**
 * Construye el string para `icon_key` combinando el icono y el color.
 */
export function buildIconKey(iconName: string, color: string): string {
  const cleanIcon = iconName.trim().toLowerCase() || DEFAULT_LOGRO_ICON;
  const cleanColor = color.trim() || DEFAULT_LOGRO_COLOR;
  return `${cleanIcon}:${cleanColor}`;
}

/**
 * Devuelve el componente de icono correspondiente o HelpCircle como fallback.
 */
export function getLogroIconComponent(iconName: string): LucideIcon {
  const clean = iconName.trim().toLowerCase();
  return LOGRO_ICON_MAP[clean] ?? HelpCircle;
}
