import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { login, validateSession, AuthError } from "@/lib/auth";
import {
  clearLoginCredentials,
  readRememberLoginPreference,
  readSavedLoginCredentials,
  saveLoginCredentials,
} from "@/lib/login-credentials";
import { ApiError } from "@/lib/api/errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  Shield,
  Zap,
  LayoutGrid,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";
import {
  BRAND_GRADIENT,
  LOGIN_FORM_BG,
  LOGIN_LEFT_GRADIENT,
} from "@/lib/theme";

function outlineShape(stroke = "rgba(255,255,255,0.28)") {
  return {
    fill: "none",
    stroke,
    strokeWidth: 1.75,
  };
}

function LeftPanelShapes() {
  const shape = outlineShape();

  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g className="login-shape login-shape-1">
        <circle cx="680" cy="100" r="150" {...shape} />
      </g>
      <g className="login-shape login-shape-2">
        <circle cx="120" cy="180" r="56" {...shape} stroke="rgba(255,255,255,0.18)" />
      </g>
      <g className="login-shape login-shape-3" transform="rotate(12 65 705)">
        <rect x="-20" y="620" width="170" height="170" rx="32" {...shape} />
      </g>
      <g className="login-shape login-shape-4">
        <circle cx="120" cy="420" r="48" {...shape} stroke="rgba(255,255,255,0.22)" />
      </g>
      <g className="login-shape login-shape-5">
        <rect x="580" y="680" width="72" height="72" rx="14" {...shape} />
      </g>
    </svg>
  );
}

function RightPanelShapes() {
  const shape = outlineShape("rgba(139, 92, 246, 0.12)");

  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g className="login-shape login-shape-6">
        <circle cx="720" cy="120" r="100" {...shape} />
      </g>
      <g className="login-shape login-shape-7">
        <rect x="40" y="640" width="120" height="120" rx="24" {...shape} />
      </g>
      <g className="login-shape login-shape-8">
        <circle cx="650" cy="780" r="40" {...shape} stroke="rgba(139, 92, 246, 0.08)" />
      </g>
    </svg>
  );
}

const FEATURES = [
  {
    icon: LayoutGrid,
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
  const [email, setEmail] = useState(() => readSavedLoginCredentials()?.email ?? "");
  const [pass, setPass] = useState(() => readSavedLoginCredentials()?.password ?? "");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(() => readRememberLoginPreference());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const handleRememberChange = (checked: boolean) => {
    setRemember(checked);
    if (!checked) {
      clearLoginCredentials();
      setEmail("");
      setPass("");
    }
  };

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
      if (remember) {
        saveLoginCredentials(email, pass);
      } else {
        clearLoginCredentials();
      }
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
        className="login-page min-h-screen grid place-items-center font-sans"
        style={{ backgroundColor: LOGIN_FORM_BG }}
      >
        <p className="login-card-subtitle text-muted-foreground">Verificando sesión…</p>
      </div>
    );
  }

  return (
    <div className="login-page min-h-screen grid lg:grid-cols-2 font-sans">
      {/* Panel izquierdo — gradiente violeta + features (estructura AuthBrandPanel) */}
      <div
        className="login-left-panel auth-brand-scroll relative hidden h-[100dvh] max-h-[100dvh] shrink-0 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain lg:flex text-white"
        style={{ background: LOGIN_LEFT_GRADIENT }}
      >
        <LeftPanelShapes />

        <div className="relative flex min-h-full flex-col">
          <div className="relative z-10 flex min-h-[100dvh] flex-col px-10 py-10 xl:px-14 xl:py-12">
            <header className="animate-fade-in shrink-0 space-y-5">
              <div className="group flex cursor-default items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                  <span className="font-display text-lg font-bold">A</span>
                </div>
                <span className="font-display text-2xl font-bold tracking-tight">
                  AdeCerebiia
                </span>
              </div>
              <div className="group inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur-sm ring-1 ring-white/20 xl:text-sm">
                <Shield className="h-3.5 w-3.5 xl:h-4 xl:w-4" strokeWidth={2.35} />
                Panel de Super Administración
              </div>
            </header>

            <main className="shrink-0 grow py-10 xl:py-12">
              <div className="max-w-[26rem] space-y-8 xl:max-w-md xl:space-y-10">
                <div className="space-y-3">
                  <h1 className="animate-stagger-up stagger-1 font-display font-bold leading-[1.2] tracking-tight text-[1.875rem] lg:text-[2rem] xl:text-[2.5rem] 2xl:text-[3rem]">
                    Control total de la plataforma.
                  </h1>
                  <p className="animate-stagger-up stagger-2 max-w-prose text-base leading-relaxed text-white/80 xl:text-lg">
                    Gestiona empresas, valida solicitudes y supervisa operaciones de adelantos de nómina.
                  </p>
                </div>

                <ul className="space-y-3">
                  {FEATURES.map(({ icon: Icon, title, description }, i) => (
                    <li
                      key={title}
                      className={`highlight-item animate-stagger-up stagger-${i + 3} flex items-start gap-4`}
                    >
                      <div className="highlight-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-base text-white">{title}</p>
                        <p className="text-sm text-white/75 xl:text-base">{description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </main>

            <footer className="mt-auto shrink-0 border-t border-white/10 pt-6">
              <p className="text-center text-xs text-white/55 xl:text-sm">
                © 2026 Cerebiia · Todos los derechos reservados
              </p>
            </footer>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div
        className="login-right-panel relative flex items-center justify-center px-4 py-6 sm:px-10 sm:py-10 overflow-hidden"
        style={{ backgroundColor: LOGIN_FORM_BG }}
      >
        <RightPanelShapes />

        <div className="relative w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="size-11 rounded-xl grid place-items-center text-white text-lg font-bold shadow-sm"
              style={{ background: BRAND_GRADIENT }}
            >
              A
            </div>
            <span className="login-brand-name font-display text-foreground">AdeCerebiia</span>
          </div>

          <div className="login-card rounded-xl bg-card p-8 sm:p-10 border border-violet-100">
            <form onSubmit={onSubmit} className="space-y-6 text-left">
              <div className="login-stagger-1">
                <h2 className="login-card-title text-foreground">Bienvenido de nuevo</h2>
                <p className="login-card-subtitle text-muted-foreground mt-2">
                  Ingresa con tu cuenta de super administrador
                </p>
              </div>

              <div className="space-y-5">
                <div className="login-stagger-2 space-y-2">
                  <Label htmlFor="email" className="login-field-label text-foreground/80">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@cerebiia.com"
                      className="login-field-input login-input-surface pl-11 h-12 rounded-xl border-border/80 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="login-stagger-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="pass" className="login-field-label text-foreground/80">
                      Contraseña
                    </Label>
                    <button
                      type="button"
                      className="login-link text-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input
                      id="pass"
                      type={showPass ? "text" : "password"}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      placeholder="Tu contraseña"
                      className="login-field-input login-input-surface pl-11 pr-11 h-12 rounded-xl border-border/80 text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPass ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="login-stagger-4 flex items-center gap-2.5">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => handleRememberChange(v === true)}
                />
                <Label htmlFor="remember" className="login-checkbox-label text-muted-foreground cursor-pointer">
                  Recordarme en este dispositivo
                </Label>
              </div>

              {error && <p className="login-error text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="login-stagger-5 login-submit-btn w-full h-12 rounded-xl flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: BRAND_GRADIENT }}
              >
                <span className="login-submit-btn-label login-submit-text flex items-center justify-center gap-2">
                  {loading ? "Ingresando…" : "Ingresar"}
                  {!loading && (
                    <ArrowRight className="size-5 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </span>
              </button>

              <div className="login-stagger-6 login-footer-note flex items-center justify-center gap-2 text-[#8B5CF6] pt-1">
                <Shield className="size-4" strokeWidth={2} />
                Acceso exclusivo para super administradores
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
