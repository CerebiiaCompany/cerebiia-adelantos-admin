import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdmin, formatCOP, type Empresa } from "@/lib/admin-store";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EmpresaNominaDialog } from "@/components/admin/empresa-nomina-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Building2, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/empresas")({
  head: () => ({ meta: [{ title: "Empresas — Panel" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { empresas, adelantos, empleados, addEmpresa, toggleEmpresa } = useAdmin();
  const [open, setOpen] = useState(false);
  const [nominaEmpresa, setNominaEmpresa] = useState<Empresa | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    nit: "",
    sector: "",
    adminNombre: "",
    adminEmail: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addEmpresa(form);
    setForm({ nombre: "", nit: "", sector: "", adminNombre: "", adminEmail: "" });
    setOpen(false);
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Empresas"
        subtitle={`${empresas.length} registradas · ${empresas.filter((e) => e.activa).length} activas`}
        aside={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-1" />
                Nueva empresa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar nueva empresa</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="nombre">Nombre de la empresa</Label>
                    <Input id="nombre" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nit">NIT</Label>
                    <Input id="nit" required value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sector">Sector</Label>
                    <Input id="sector" required value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="admin-eyebrow mb-3">Administrador de la empresa</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="adminNombre">Nombre</Label>
                      <Input id="adminNombre" required value={form.adminNombre} onChange={(e) => setForm({ ...form, adminNombre: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="adminEmail">Correo</Label>
                      <Input id="adminEmail" type="email" required value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button type="submit">Crear empresa</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="admin-panel-card-flush">
        <table className="admin-table">
          <thead className="admin-table-head">
            <tr>
              <th className="admin-table-th text-left">Empresa</th>
              <th className="admin-table-th text-left hidden md:table-cell">NIT</th>
              <th className="admin-table-th text-left hidden lg:table-cell">Admin</th>
              <th className="admin-table-th text-right">Empleados</th>
              <th className="admin-table-th text-right">Adelantos</th>
              <th className="admin-table-th text-right">Total</th>
              <th className="admin-table-th text-center w-[52px]"> </th>
              <th className="admin-table-th text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {empresas.map((e) => {
              const list = adelantos.filter((a) => a.empresaId === e.id);
              const total = list.reduce((s, a) => s + a.monto, 0);
              const empleadosNomina = empleados.filter((emp) => emp.empresaId === e.id).length;
              return (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-md bg-muted grid place-items-center">
                        <Building2 className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{e.nombre}</div>
                        <div className="text-xs text-muted-foreground">{e.sector}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell tabular admin-table-cell-mono">{e.nit}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div>{e.adminNombre}</div>
                    <div className="text-xs text-muted-foreground">{e.adminEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular">{empleadosNomina}</td>
                  <td className="px-4 py-3 text-right tabular">{list.length}</td>
                  <td className="px-4 py-3 text-right admin-table-cell-money">{formatCOP(total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                        onClick={() => setNominaEmpresa(e)}
                        title="Ver nómina de empleados"
                        aria-label={`Ver nómina de ${e.nombre}`}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-xs ${e.activa ? "text-success" : "text-muted-foreground"}`}>
                        {e.activa ? "Activa" : "Inactiva"}
                      </span>
                      <Switch checked={e.activa} onCheckedChange={() => toggleEmpresa(e.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EmpresaNominaDialog
        empresa={nominaEmpresa}
        empleados={empleados}
        adelantos={adelantos}
        onClose={() => setNominaEmpresa(null)}
      />
    </div>
  );
}
