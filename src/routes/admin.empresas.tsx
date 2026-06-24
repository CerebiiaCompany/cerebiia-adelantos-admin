import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdmin, formatCOP } from "@/lib/admin-store";
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
import { Plus, Building2 } from "lucide-react";

export const Route = createFileRoute("/admin/empresas")({
  head: () => ({ meta: [{ title: "Empresas — Panel" }] }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { empresas, adelantos, addEmpresa, toggleEmpresa } = useAdmin();
  const [open, setOpen] = useState(false);

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
    <div className="p-6 md:p-10 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Catálogo</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {empresas.length} registradas · {empresas.filter((e) => e.activa).length} activas
          </p>
        </div>

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
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Administrador de la empresa</p>
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
      </header>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Empresa</th>
              <th className="text-left font-medium px-4 py-3 hidden md:table-cell">NIT</th>
              <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Admin</th>
              <th className="text-right font-medium px-4 py-3">Adelantos</th>
              <th className="text-right font-medium px-4 py-3">Total</th>
              <th className="text-right font-medium px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {empresas.map((e) => {
              const list = adelantos.filter((a) => a.empresaId === e.id);
              const total = list.reduce((s, a) => s + a.monto, 0);
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
                  <td className="px-4 py-3 hidden md:table-cell tabular text-muted-foreground">{e.nit}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div>{e.adminNombre}</div>
                    <div className="text-xs text-muted-foreground">{e.adminEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular">{list.length}</td>
                  <td className="px-4 py-3 text-right tabular font-medium">{formatCOP(total)}</td>
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
    </div>
  );
}
