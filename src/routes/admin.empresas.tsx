import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { createEmpresa, listarEmpresas, reactivarEmpresa } from "@/lib/api/empresas";
import { deactivateUser, listUsers } from "@/lib/api/users";
import type { EmpresaListItem } from "@/lib/api/types";
import { useAdmin, formatCOP } from "@/lib/admin-store";
import { useEmpleadosMetricas } from "@/hooks/use-empleados-metricas";
import { useSolicitudesAdmin } from "@/hooks/use-solicitudes-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmpresaNominaDialog } from "@/components/admin/empresa-nomina-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import type { Empresa } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/empresas")({
  head: () => ({ meta: [{ title: "Empresas — Panel" }] }),
  component: EmpresasPage,
});

type EmpresaRow = EmpresaListItem & {
  adminNombre: string;
  adminEmail: string;
};

const emptyForm = {
  nombre: "",
  nit: "",
  adminNombre: "",
  adminEmail: "",
  adminPassword: "",
};

function EmpresasPage() {
  const { empresas: mockEmpresas, empleados } = useAdmin();
  const { adelantos: solicitudesApi } = useSolicitudesAdmin();
  const { data: empleadosMetricas } = useEmpleadosMetricas();
  const [rows, setRows] = useState<EmpresaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [nominaEmpresa, setNominaEmpresa] = useState<Empresa | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadEmpresas = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [empresas, admins] = await Promise.all([
        listarEmpresas(),
        listUsers({ role: "empresa" }),
      ]);
      const adminById = new Map(admins.map((u) => [u.id, u]));
      setRows(
        empresas
          .map((e) => {
            const admin = adminById.get(e.user_id);
            return {
              ...e,
              adminNombre: admin?.full_name ?? "—",
              adminEmail: admin?.email ?? "—",
            };
          })
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
      );
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : "No se pudieron cargar las empresas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmpresas();
  }, [loadEmpresas]);

  const activas = useMemo(() => rows.filter((r) => r.activa).length, [rows]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await createEmpresa({
        nombre: form.nombre.trim(),
        nit: form.nit.trim(),
        email: form.adminEmail.trim(),
        password: form.adminPassword,
        full_name: form.adminNombre.trim(),
      });

      setForm(emptyForm);
      setShowPassword(false);
      setOpen(false);
      await loadEmpresas();
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "No se pudo crear la empresa.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActiva = async (row: EmpresaRow, nextActiva: boolean) => {
    setTogglingId(row.id);
    setLoadError(null);

    try {
      if (!nextActiva) {
        await deactivateUser(row.user_id);
      } else {
        await reactivarEmpresa(row.id);
      }
      await loadEmpresas();
    } catch (error) {
      setLoadError(
        error instanceof ApiError
          ? error.message
          : nextActiva
            ? "No se pudo reactivar la empresa."
            : "No se pudo desactivar la empresa.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const openNomina = (row: EmpresaRow) => {
    const mock = mockEmpresas.find((e) => e.id === row.id || e.nit === row.nit);
    if (mock) {
      setNominaEmpresa(mock);
      return;
    }
    setLoadError("La nómina local de prueba solo está disponible para empresas demo del panel.");
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Empresas"
        subtitle={`${rows.length} registradas · ${activas} activas${
          empleadosMetricas
            ? ` · ${empleadosMetricas.activos} empleados activos (${empleadosMetricas.total_empleados} total)`
            : ""
        }`}
        aside={
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
                Nueva empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar nueva empresa</DialogTitle>
                <DialogDescription>
                  Crea la empresa en el sistema y, al mismo tiempo, el usuario administrador con rol{" "}
                  <strong>empresa</strong> (correo y contraseña para iniciar sesión). Ese usuario
                  también aparecerá en el módulo Usuarios.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                {submitError && (
                  <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                    {submitError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="nombre">Nombre de la empresa</Label>
                    <Input
                      id="nombre"
                      required
                      maxLength={255}
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="nit">NIT</Label>
                    <Input
                      id="nit"
                      required
                      value={form.nit}
                      onChange={(e) => setForm({ ...form, nit: e.target.value })}
                      placeholder="900123456-7"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="admin-eyebrow mb-3">Administrador de la empresa</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="adminNombre">Nombre</Label>
                      <Input
                        id="adminNombre"
                        required
                        maxLength={255}
                        value={form.adminNombre}
                        onChange={(e) => setForm({ ...form, adminNombre: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="adminEmail">Correo</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        required
                        value={form.adminEmail}
                        onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="adminPassword">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="adminPassword"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={form.adminPassword}
                          onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
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
                      "Crear empresa"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loadError && (
        <p className="mb-4 text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          {loadError}
        </p>
      )}

      <div className="admin-panel-card-flush">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Cargando empresas…
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table min-w-[44rem]">
              <thead className="admin-table-head">
                <tr>
                  <th className="admin-table-th text-left">Empresa</th>
                  <th className="admin-table-th text-left hidden md:table-cell">NIT</th>
                  <th className="admin-table-th text-left hidden lg:table-cell">Admin</th>
                  <th className="admin-table-th text-right">Empleados</th>
                  <th className="admin-table-th text-right">Adelantos</th>
                  <th className="admin-table-th text-right">Monto adelantado</th>
                  <th className="admin-table-th text-center w-14"> </th>
                  <th className="admin-table-th text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const mock = mockEmpresas.find((e) => e.id === row.id || e.nit === row.nit);
                  const monto = Number(row.monto_total_adelantado) || 0;

                  return (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td>
                        <div className="flex items-center gap-3.5">
                          <div className="admin-table-icon-wrap">
                            <Building2 className="admin-table-icon" />
                          </div>
                          <div>
                            <div className="admin-table-cell-title">{row.nombre}</div>
                            <div className="admin-table-cell-sub tabular">{row.nit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell tabular admin-table-cell-mono">{row.nit}</td>
                      <td className="hidden lg:table-cell">
                        <div className="admin-table-cell-title font-medium">{row.adminNombre}</div>
                        <div className="admin-table-cell-sub">{row.adminEmail}</div>
                      </td>
                      <td className="text-right tabular text-base">{row.total_empleados}</td>
                      <td className="text-right tabular text-base">{row.total_solicitudes}</td>
                      <td className="text-right admin-table-cell-money">
                        {monto > 0 ? formatCOP(monto) : "—"}
                      </td>
                      <td>
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-10 text-primary hover:text-primary/80 hover:bg-primary/10"
                            onClick={() => openNomina(row)}
                            title="Ver nómina de empleados"
                            aria-label={`Ver nómina de ${row.nombre}`}
                            disabled={!mock}
                          >
                            <Eye className="size-5" />
                          </Button>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2 sm:gap-3">
                          <span
                            className={`hidden sm:inline text-sm font-medium ${row.activa ? "text-success" : "text-muted-foreground"}`}
                          >
                            {row.activa ? "Activa" : "Inactiva"}
                          </span>
                          <Switch
                            checked={row.activa}
                            disabled={togglingId === row.id}
                            onCheckedChange={(checked) => {
                              void handleToggleActiva(row, checked);
                            }}
                            aria-label={row.activa ? "Desactivar empresa" : "Reactivar empresa"}
                            title={row.activa ? "Desactivar empresa" : "Reactivar empresa"}
                            className="h-6 w-11 data-[state=checked]:[&>span]:translate-x-5 [&>span]:h-5 [&>span]:w-5"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="admin-table-empty">
                      No hay empresas registradas. Crea la primera con el botón «Nueva empresa».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmpresaNominaDialog
        empresa={nominaEmpresa}
        empleados={empleados}
        adelantos={solicitudesApi}
        onClose={() => setNominaEmpresa(null)}
      />
    </div>
  );
}
