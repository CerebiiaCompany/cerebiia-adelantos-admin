import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdmin, formatCOP, estadoLabel, type Adelanto, type EstadoAdelanto } from "@/lib/admin-store";
import { useAdelantosFilters } from "@/lib/adelantos-filters";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdelantosFiltersPanel } from "@/components/admin/adelantos-filters-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, Upload, Copy, CheckCircle2, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/admin/adelantos")({
  head: () => ({ meta: [{ title: "Adelantos — Panel" }] }),
  component: AdelantosPage,
});

const ESTADO_COLORS: Record<EstadoAdelanto, string> = {
  solicitado: "bg-info/15 text-info border-info/30",
  en_revision: "bg-warning/15 text-warning border-warning/30",
  aprobado: "bg-primary/15 text-primary border-primary/30",
  pagado: "bg-success/15 text-success border-success/30",
  rechazado: "bg-destructive/15 text-destructive border-destructive/30",
};

function AdelantosPage() {
  const { empresas, adelantos, updateAdelantoEstado, marcarPagado } = useAdmin();
  const [viewing, setViewing] = useState<Adelanto | null>(null);
  const [paying, setPaying] = useState<Adelanto | null>(null);

  const { empresaId, setEmpresaId, estado, setEstado, filtered } = useAdelantosFilters(
    adelantos,
    empresas,
  );

  const hasFilters = empresaId !== "all" || estado !== "all";

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Operaciones"
        title="Adelantos"
        subtitle="Consulta y gestiona las solicitudes de adelanto realizadas por los empleados."
      />

      <AdelantosFiltersPanel
        showMes={false}
        empresaId={empresaId}
        setEmpresaId={setEmpresaId}
        estado={estado}
        setEstado={setEstado}
        empresas={empresas}
        filteredCount={filtered.length}
      />

      <div className="admin-panel-card-flush">
        <div className="admin-card-toolbar">
          <h2 className="admin-section-title">Solicitudes de adelanto</h2>
          <span className="text-xs text-muted-foreground">{filtered.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-left">Empleado</th>
                <th className="admin-table-th text-left hidden md:table-cell">Empresa</th>
                <th className="admin-table-th text-left hidden lg:table-cell">Fecha</th>
                <th className="admin-table-th text-right">Monto</th>
                <th className="admin-table-th text-center">Estado</th>
                <th className="admin-table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const e = empresas.find((x) => x.id === a.empresaId);
                return (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.empleadoNombre}</div>
                      <div className="admin-table-cell-note tabular">CC {a.empleadoCedula}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{e?.nombre}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground tabular">
                      {new Date(a.fechaSolicitud).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-right admin-table-cell-money">{formatCOP(a.monto)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <EstadoSelect value={a.estado} onChange={(v) => updateAdelantoEstado(a.id, v)} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {a.estado === "aprobado" && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => setViewing(a)} title="Ver cuenta">
                              <Eye className="size-4" />
                            </Button>
                            <Button size="sm" onClick={() => setPaying(a)} className="h-8">
                              <Upload className="size-3.5 mr-1" /> Pagar
                            </Button>
                          </>
                        )}
                        {a.estado === "pagado" && (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <FileCheck2 className="size-3.5" /> Comprobante
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    {hasFilters || adelantos.length > 0
                      ? "No hay solicitudes que coincidan con los filtros seleccionados."
                      : "No hay solicitudes de adelanto registradas."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CuentaDialog
        adelanto={viewing}
        empresa={viewing ? empresas.find((x) => x.id === viewing.empresaId)?.nombre : undefined}
        onClose={() => setViewing(null)}
      />
      <PagoDialog
        adelanto={paying}
        onClose={() => setPaying(null)}
        onPagar={(url) => paying && marcarPagado(paying.id, url)}
      />
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoAdelanto }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium rounded-md border px-2 py-0.5 ${ESTADO_COLORS[estado]}`}
    >
      {estadoLabel[estado]}
    </span>
  );
}

function EstadoSelect({ value, onChange }: { value: EstadoAdelanto; onChange: (v: EstadoAdelanto) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as EstadoAdelanto)}>
      <SelectTrigger className="h-7 px-2 w-auto border-none bg-transparent hover:bg-muted/50 [&>svg]:size-3">
        <SelectValue asChild>
          <EstadoBadge estado={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(estadoLabel) as EstadoAdelanto[])
          .filter((e) => e !== "pagado")
          .map((e) => (
            <SelectItem key={e} value={e}>
              {estadoLabel[e]}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="font-medium tabular">{value}</div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
      >
        {done ? <CheckCircle2 className="size-4 text-success" /> : <Copy className="size-4" />}
      </Button>
    </div>
  );
}

function CuentaDialog({
  adelanto,
  empresa,
  onClose,
}: {
  adelanto: Adelanto | null;
  empresa?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!adelanto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datos para el pago</DialogTitle>
        </DialogHeader>
        {adelanto && (
          <div>
            <div className="rounded-lg bg-surface border border-border p-4 mb-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Beneficiario</div>
              <div className="font-semibold">{adelanto.empleadoNombre}</div>
              <div className="text-xs text-muted-foreground">
                CC {adelanto.empleadoCedula} · {empresa}
              </div>
            </div>
            <CopyRow label="Banco" value={adelanto.cuenta.banco} />
            <CopyRow label="Tipo de cuenta" value={adelanto.cuenta.tipo} />
            <CopyRow label="Número de cuenta" value={adelanto.cuenta.numero} />
            <CopyRow label="Monto a transferir" value={formatCOP(adelanto.monto)} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PagoDialog({
  adelanto,
  onClose,
  onPagar,
}: {
  adelanto: Adelanto | null;
  onClose: () => void;
  onPagar: (url: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    onPagar(file.name);
    setFile(null);
    onClose();
  };

  return (
    <Dialog open={!!adelanto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como pagado</DialogTitle>
        </DialogHeader>
        {adelanto && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-lg bg-surface border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{adelanto.empleadoNombre}</div>
                  <div className="text-xs text-muted-foreground">
                    {adelanto.cuenta.banco} · {adelanto.cuenta.numero}
                  </div>
                </div>
                <div className="text-lg font-semibold tabular">{formatCOP(adelanto.monto)}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comprobante">Comprobante de pago</Label>
              <Input
                id="comprobante"
                type="file"
                accept="image/*,application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Al subir el comprobante, el adelanto pasa automáticamente a estado{" "}
                <span className="text-success font-medium">Pagado</span>.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!file}>
                <Upload className="size-4 mr-1" /> Confirmar pago
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
