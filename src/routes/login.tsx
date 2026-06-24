import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { login, validateSession, AuthError } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  Shield,
  Zap,
  LayoutDashboard,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Building2,
} from "lucide-react";

const GRADIENT = "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)";
const LEFT_PANEL_BG = "#E8EEF6";
const RIGHT_PANEL_BG = "#F5F8FC";
const FONT_INTER = '"Inter", ui-sans-serif, system-ui, sans-serif';

function LoginGradientDefs({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#3B82F6" />
      <stop offset="50%" stopColor="#6366F1" />
      <stop offset="100%" stopColor="#8B5CF6" />
    </linearGradient>
  );
}

function leftPanelShapeProps(gradientId: string) {
  return {
    fill: "#FFFFFF",
    fillOpacity: 0.45,
    stroke: `url(#${gradientId})`,
    strokeOpacity: 0.22,
    strokeWidth: 2,
  };
}

function LeftPanelShapes() {
  const gradientId = "login-gradient-left";
  const shapeProps = leftPanelShapeProps(gradientId);

  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <LoginGradientDefs id={gradientId} />
      </defs>

      <g className="login-shape login-shape-1">
        <circle cx="680" cy="100" r="150" {...shapeProps} />
      </g>
      <g className="login-shape login-shape-3" transform="rotate(12 65 705)">
        <rect x="-20" y="620" width="170" height="170" rx="32" {...shapeProps} />
      </g>
      <g className="login-shape login-shape-5">
        <circle cx="120" cy="420" r="48" {...shapeProps} />
      </g>
      <g className="login-shape login-shape-7">
        <rect x="580" y="680" width="72" height="72" rx="14" {...shapeProps} />
      </g>
    </svg>
  );
}

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Gestión centralizada",
    description: "Administra empresas, empleados y solicitudes desde un solo panel.",
  },
  {
    icon: Shield,
    title: "Seguridad reforzada",
    description: "Acceso restringido con trazabilidad de cada operación.",
  },
  {
    icon: Zap,
    title: "Operaciones en tiempo real",
    description: "Monitorea pagos y adelantos al instante.",
  },
] as const;

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Ingresar — Super Admin Cerebiia" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    validateSession().then((user) => {
      if (cancelled) return;
      if (user) navigate({ to: "/admin" });
      else setCheckingSession(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, pass, remember);
      navigate({ to: "/admin" });
    } catch (err) {
      if (err instanceof AuthError || err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div
        className="min-h-screen grid place-items-center"
        style={{ fontFamily: FONT_INTER, backgroundColor: RIGHT_PANEL_BG }}
      >
        <p className="text-sm text-muted-foreground">Verificando sesión…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen grid lg:grid-cols-2"
      style={{ fontFamily: FONT_INTER }}
    >
      {/* Panel izquierdo — branding */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-slate-800"
        style={{ backgroundColor: LEFT_PANEL_BG }}
      >
        <LeftPanelShapes />

        <div className="relative flex items-center gap-3">
          <div
            className="size-10 rounded-xl grid place-items-center font-bold text-lg text-white shadow-sm"
            style={{ background: GRADIENT }}
          >
            A
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-800">AdeCerebiia</span>
        </div>

        <div className="relative space-y-8 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            <Shield className="size-3.5 text-[#6366F1]" />
            Panel de Super Administración
          </span>

          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight leading-[1.08] text-slate-900">
              Control total de la plataforma.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              Gestiona empresas, valida solicitudes y supervisa operaciones de adelantos de nómina.
            </p>
          </div>

          <ul className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-4">
                <div
                  className="size-10 shrink-0 rounded-xl bg-white border border-slate-200/80 grid place-items-center shadow-sm"
                  style={{ color: "#6366F1" }}
                >
                  <Icon className="size-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-slate-400">
          © 2026 Cerebiia · Todos los derechos reservados
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div
        className="relative flex items-center justify-center p-6 sm:p-12"
        style={{ backgroundColor: RIGHT_PANEL_BG }}
      >
        <div className="relative w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="size-10 rounded-xl grid place-items-center text-white font-bold text-lg"
              style={{ background: GRADIENT }}
            >
              A
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">AdeCerebiia</span>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-[0_8px_40px_-12px_rgba(59,130,246,0.12)] border border-slate-100">
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Bienvenido de nuevo
                </h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Ingresa con tu cuenta de super administrador
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@cerebiia.com"
                      className="pl-10 h-11 rounded-xl border-border/80 bg-[#F8FAFC]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass" className="text-foreground font-medium">
                      Contraseña
                    </Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-[#3B82F6] hover:text-[#6366F1] transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="pass"
                      type={showPass ? "text" : "password"}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="pl-10 pr-10 h-11 rounded-xl border-border/80 bg-[#F8FAFC]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Recordarme en este dispositivo
                </Label>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="login-submit-btn w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: GRADIENT }}
              >
                <span className="login-submit-btn-label flex items-center justify-center gap-2">
                  {loading ? "Ingresando…" : "Ingresar"}
                  {!loading && (
                    <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </span>
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                <Building2 className="size-3.5 text-[#8B5CF6]" />
                Acceso exclusivo para super administradores
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
