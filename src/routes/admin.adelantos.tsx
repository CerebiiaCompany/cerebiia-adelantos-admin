import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAdmin, formatCOP, estadoLabel, type Adelanto, type EstadoAdelanto } from "@/lib/admin-store";
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

function monthKey(d: string) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

function AdelantosPage() {
  const { empresas, adelantos, updateAdelantoEstado, marcarPagado } = useAdmin();

  const months = useMemo(() => {
    const set = new Set(adelantos.map((a) => monthKey(a.fechaSolicitud)));
    return Array.from(set).sort().reverse();
  }, [adelantos]);

  const [mes, setMes] = useState<string>("all");
  const [empresaId, setEmpresaId] = useState<string>("all");
  const [estado, setEstado] = useState<string>("all");
  const [viewing, setViewing] = useState<Adelanto | null>(null);
  const [paying, setPaying] = useState<Adelanto | null>(null);

  const filtered = useMemo(() => {
    return adelantos
      .filter((a) => (mes === "all" ? true : monthKey(a.fechaSolicitud) === mes))
      .filter((a) => (empresaId === "all" ? true : a.empresaId === empresaId))
      .filter((a) => (estado === "all" ? true : a.estado === estado))
      .sort((a, b) => +new Date(b.fechaSolicitud) - +new Date(a.fechaSolicitud));
  }, [adelantos, mes, empresaId, estado]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, a) => s + a.monto, 0);
    const aprobados = filtered.filter((a) => a.estado === "aprobado");
    const totalAprobado = aprobados.reduce((s, a) => s + a.monto, 0);
    const pagados = filtered.filter((a) => a.estado === "pagado");
    const totalPagado = pagados.reduce((s, a) => s + a.monto, 0);
    return { total, totalAprobado, totalPagado, countAprobado: aprobados.length };
  }, [filtered]);

  // group by empresa for the active filter
  const porEmpresa = useMemo(() => {
    const map = new Map<string, { count: number; total: number; aprobado: number }>();
    for (const a of filtered) {
      const e = map.get(a.empresaId) ?? { count: 0, total: 0, aprobado: 0 };
      e.count++;
      e.total += a.monto;
      if (a.estado === "aprobado") e.aprobado += a.monto;
      map.set(a.empresaId, e);
    }
    return Array.from(map.entries())
      .map(([id, v]) => ({ empresa: empresas.find((x) => x.id === id), ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, empresas]);

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Operaciones</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">Adelantos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Filtra por mes y empresa, valida y procesa pagos a empleados.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Mes</Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los meses</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m} className="capitalize">
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Empresa</Label>
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Estado</Label>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(Object.keys(estadoLabel) as EstadoAdelanto[]).map((e) => (
                <SelectItem key={e} value={e}>{estadoLabel[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Mostrando</div>
          <div className="font-semibold">{filtered.length} solicitudes</div>
        </div>
      </div>

      {/* KPIs filtered */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total filtrado" value={formatCOP(totals.total)} />
        <Stat label="Aprobado (por pagar)" value={formatCOP(totals.totalAprobado)} highlight />
        <Stat label="Aprobaciones pendientes" value={String(totals.countAprobado)} />
        <Stat label="Ya pagado" value={formatCOP(totals.totalPagado)} />
      </div>

      {/* Resumen por empresa (para cobro) */}
      {porEmpresa.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Total a cobrar por empresa</h2>
              <p className="text-xs text-muted-foreground">Suma de adelantos en el filtro actual.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {porEmpresa.map(({ empresa, count, total, aprobado }) => (
              <div key={empresa?.id} className="rounded-lg border border-border p-4 bg-surface">
                <div className="font-medium">{empresa?.nombre ?? "—"}</div>
                <div className="text-xs text-muted-foreground mb-3">{count} adelantos</div>
                <div className="text-xl font-semibold tabular">{formatCOP(total)}</div>
                {aprobado > 0 && (
                  <div className="text-xs text-primary mt-1 tabular">{formatCOP(aprobado)} aprobado</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Empleado</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Empresa</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Fecha</th>
                <th className="text-right font-medium px-4 py-3">Monto</th>
                <th className="text-center font-medium px-4 py-3">Estado</th>
                <th className="text-right font-medium px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const e = empresas.find((x) => x.id === a.empresaId);
                return (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.empleadoNombre}</div>
                      <div className="text-xs text-muted-foreground tabular">CC {a.empleadoCedula}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{e?.nombre}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground tabular">
                      {new Date(a.fechaSolicitud).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-right tabular font-medium">{formatCOP(a.monto)}</td>
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
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Sin resultados para los filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CuentaDialog adelanto={viewing} empresa={viewing ? empresas.find((x) => x.id === viewing.empresaId)?.nombre : undefined} onClose={() => setViewing(null)} />
      <PagoDialog adelanto={paying} onClose={() => setPaying(null)} onPagar={(url) => paying && marcarPagado(paying.id, url)} />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-primary/30 bg-primary/[0.05]" : "border-border bg-card"}`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-xl md:text-2xl font-semibold tabular mt-1">{value}</div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoAdelanto }) {
  return (
    <span className={`inline-flex items-center text-[10px] uppercase tracking-wider border rounded-full px-2 py-0.5 ${ESTADO_COLORS[estado]}`}>
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
          .filter((e) => e !== "pagado") // pagado se logra via comprobante
          .map((e) => (
            <SelectItem key={e} value={e}>{estadoLabel[e]}</SelectItem>
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
              <div className="text-xs text-muted-foreground">CC {adelanto.empleadoCedula} · {empresa}</div>
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
                  <div className="text-xs text-muted-foreground">{adelanto.cuenta.banco} · {adelanto.cuenta.numero}</div>
                </div>
                <div className="text-lg font-semibold tabular">{formatCOP(adelanto.monto)}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comprobante">Comprobante de pago</Label>
              <Input id="comprobante" type="file" accept="image/*,application/pdf" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">Al subir el comprobante, el adelanto pasa automáticamente a estado <span className="text-success font-medium">Pagado</span>.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
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
