import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import type { User, UserRole } from "@/lib/api/types";
import { createUser, deactivateUser, getUser, listUsers } from "@/lib/api/users";
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/lib/user-roles";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, UserX, Eye, EyeOff, Info } from "lucide-react";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — Panel" }] }),
  component: UsuariosPage,
});

const emptyForm = {
  email: "",
  full_name: "",
  password: "",
};

function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await createUser({
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        password: form.password,
        role: "empleado",
      });
      setForm(emptyForm);
      setShowPassword(false);
      setOpen(false);
      await loadUsers();
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (user: User) => {
    if (!user.is_active) return;
    if (!window.confirm(`¿Desactivar a ${user.full_name}? No podrá iniciar sesión.`)) return;

    setDeactivatingId(user.id);
    setError(null);

    try {
      await deactivateUser(user.id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo desactivar el usuario.");
    } finally {
      setDeactivatingId(null);
    }
  };

  const openDetail = async (userId: string) => {
    setDetailUserId(userId);
    setDetailUser(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setDetailUser(await getUser(userId));
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : "No se pudo cargar el detalle del usuario.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Accesos"
        title="Usuarios"
        subtitle="Listado global de accesos. Las empresas se registran solo desde el módulo Empresas."
        aside={
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | "all")}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SelectValue placeholder="Filtrar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="super_admin">Super admin</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="empleado">Empleado</SelectItem>
              </SelectContent>
            </Select>

            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (!next) {
                  setShowPassword(false);
                  setSubmitError(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-1" />
                  Nuevo empleado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear usuario empleado</DialogTitle>
                  <DialogDescription>
                    Solo crea cuentas con rol <strong>empleado</strong> (nombre, correo y contraseña).
                    Para registrar una <strong>empresa</strong> con NIT y administrador, usa{" "}
                    <Link to="/admin/empresas" className="text-primary font-medium hover:underline">
                      Empresas → Nueva empresa
                    </Link>
                    .
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                  {submitError && (
                    <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                      {submitError}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input
                      id="full_name"
                      required
                      maxLength={255}
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Creando…
                        </>
                      ) : (
                        "Crear empleado"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {error && (
        <p className="mb-4 text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          {error}
        </p>
      )}

      <p className="mb-4 text-sm text-muted-foreground">
        {users.length} en el sistema · {users.filter((u) => u.is_active).length} activos
      </p>

      <div className="admin-panel-card-flush">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Cargando usuarios…
          </div>
        ) : (
          <div className="admin-table-scroll">
          <table className="admin-table">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-left">Usuario</th>
                <th className="admin-table-th text-left hidden md:table-cell">Correo</th>
                <th className="admin-table-th text-center">Rol</th>
                <th className="admin-table-th text-center">Estado</th>
                <th className="admin-table-th text-left hidden lg:table-cell">Registro</th>
                <th className="admin-table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td>
                    <div className="admin-table-cell-title">{user.full_name}</div>
                    <div className="admin-table-cell-sub md:hidden">{user.email}</div>
                  </td>
                  <td className="hidden md:table-cell admin-table-cell-sub">{user.email}</td>
                  <td className="text-center">
                    <span
                      className={`inline-flex items-center text-sm font-medium rounded-md border px-2.5 py-1 ${ROLE_BADGE_CLASSES[user.role]}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`text-sm font-medium ${user.is_active ? "text-success" : "text-muted-foreground"}`}
                    >
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell text-muted-foreground tabular">
                    {new Date(user.created_at).toLocaleDateString("es-CO")}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-10"
                        onClick={() => void openDetail(user.id)}
                        title="Ver detalle"
                        aria-label="Ver detalle del usuario"
                      >
                        <Info className="size-5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 sm:px-3"
                        disabled={!user.is_active || deactivatingId === user.id || user.role === "super_admin"}
                        onClick={() => void handleDeactivate(user)}
                        title={
                          user.role === "super_admin"
                            ? "No se puede desactivar un super admin"
                            : "Desactivar usuario"
                        }
                        aria-label="Desactivar usuario"
                      >
                        {deactivatingId === user.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <UserX className="size-4 sm:mr-1.5" />
                            <span className="hidden sm:inline">Desactivar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    No hay usuarios que coincidan con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!detailUserId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailUserId(null);
            setDetailUser(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de usuario</DialogTitle>
            <DialogDescription>Información completa desde GET /users/{"{id}"}/</DialogDescription>
          </DialogHeader>
          {detailLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="size-4 animate-spin" />
              Cargando…
            </p>
          )}
          {detailError && (
            <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
              {detailError}
            </p>
          )}
          {detailUser && !detailLoading && (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Nombre</dt>
                <dd className="font-semibold">{detailUser.full_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Correo</dt>
                <dd>{detailUser.email}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Rol</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center text-sm font-medium rounded-md border px-2 py-0.5 ${ROLE_BADGE_CLASSES[detailUser.role]}`}
                    >
                      {ROLE_LABELS[detailUser.role]}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Estado</dt>
                  <dd className={detailUser.is_active ? "text-success font-medium" : "text-muted-foreground"}>
                    {detailUser.is_active ? "Activo" : "Inactivo"}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">ID</dt>
                <dd className="font-mono text-xs break-all">{detailUser.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">Registro</dt>
                <dd className="tabular">
                  {new Date(detailUser.created_at).toLocaleString("es-CO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
