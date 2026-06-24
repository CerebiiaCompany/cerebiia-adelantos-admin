import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isLoggedIn, login, DEMO_USER, DEMO_PASS } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Zap } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Ingresar — Panel Adelantos" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_USER);
  const [pass, setPass] = useState(DEMO_PASS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn()) navigate({ to: "/admin" });
  }, [navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, pass)) navigate({ to: "/admin" });
    else setError("Credenciales incorrectas");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual side */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-surface">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(600px circle at 20% 30%, oklch(0.86 0.22 130 / 0.18), transparent 60%), radial-gradient(500px circle at 80% 80%, oklch(0.72 0.14 230 / 0.15), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="size-8 rounded-md bg-primary grid place-items-center text-primary-foreground">
            <Zap className="size-4" strokeWidth={2.5} />
          </div>
          <span className="font-semibold tracking-tight">Adelantos · Panel</span>
        </div>

        <div className="relative space-y-6 max-w-md">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Operaciones internas</p>
          <h1 className="text-5xl font-semibold tracking-tight leading-[1.05]">
            Gestiona los adelantos de nómina<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground">
            Visualiza solicitudes, valida empleados y dispara pagos a las empresas registradas — en un solo panel.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4 text-sm">
          {[
            ["Empresas", "+24"],
            ["Solicitudes/mes", "1.4k"],
            ["Pagado YTD", "$842M"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-2xl font-semibold tabular">{v}</div>
              <div className="text-muted-foreground">{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="size-8 rounded-md bg-primary grid place-items-center text-primary-foreground">
              <Zap className="size-4" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight">Adelantos · Panel</span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Bienvenido de vuelta</h2>
            <p className="text-sm text-muted-foreground mt-1">Ingresa con tu cuenta de administrador.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pass">Contraseña</Label>
              <Input id="pass" type="password" value={pass} onChange={(e) => setPass(e.target.value)} required />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full group">
            Entrar al panel
            <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>

          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Demo:</span> {DEMO_USER} / {DEMO_PASS}
          </div>
        </form>
      </div>
    </div>
  );
}
