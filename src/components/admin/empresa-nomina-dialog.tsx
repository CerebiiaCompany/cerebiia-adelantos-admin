import { useMemo, useState } from "react";
import type { Adelanto, Empresa } from "@/lib/admin-store";
import {
  calcularTotalAdelantadoEmpleado,
  calcularTotalPagadoEmpleado,
  formatCOP,
} from "@/lib/admin-store";
import { useAdelantoParametros } from "@/hooks/use-adelanto-parametros";
import { calcularSaldoDisponibleNeto } from "@/lib/cuotas-adelanto";
import type { NominaEmpleado } from "@/lib/nomina-mapper";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, UserRound } from "lucide-react";

type EstadoFiltro = "all" | "activo" | "suspendido" | "pendiente";

const ESTADO_API: Record<Exclude<EstadoFiltro, "all">, string> = {
  activo: "activo",
  suspendido: "inactivo",
  pendiente: "pre_registrado",
};

function labelEstado(estado: string | undefined): string {
  switch ((estado ?? "").toLowerCase()) {
    case "activo":
      return "Activo";
    case "inactivo":
      return "Suspendido";
    case "pre_registrado":
      return "Pendiente";
    default:
      return estado?.trim() || "—";
  }
}

function estadoBadgeClass(estado: string | undefined): string {
  switch ((estado ?? "").toLowerCase()) {
    case "activo":
      return "bg-success/15 text-success border-success/35";
    case "pre_registrado":
      return "bg-warning/15 text-warning border-warning/35";
    case "inactivo":
      return "bg-destructive/15 text-destructive border-destructive/35";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function fechaIngresoDia(fecha: string | undefined): string | null {
  if (!fecha) return null;
  // API puede enviar YYYY-MM-DD o ISO datetime
  return fecha.slice(0, 10);
}

type EmpresaNominaDialogProps = {
  empresa: Empresa | null;
  empleados: NominaEmpleado[];
  adelantos: Adelanto[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
};

export function EmpresaNominaDialog({
  empresa,
  empleados,
  adelantos,
  loading = false,
  error = null,
  onClose,
}: EmpresaNominaDialogProps) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const { valorComision } = useAdelantoParametros();

  const deEmpresa = useMemo(
    () => (empresa ? empleados.filter((e) => e.empresaId === empresa.id) : []),
    [empresa, empleados],
  );

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return deEmpresa.filter((e) => {
      if (q) {
        const match =
          e.nombre.toLowerCase().includes(q) ||
          e.documento.includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.celular.includes(q);
        if (!match) return false;
      }

      if (estadoFiltro !== "all") {
        const esperado = ESTADO_API[estadoFiltro];
        if ((e.estado ?? "").toLowerCase() !== esperado) return false;
      }

      const dia = fechaIngresoDia(e.fechaIngreso);
      if (fechaDesde && (!dia || dia < fechaDesde)) return false;
      if (fechaHasta && (!dia || dia > fechaHasta)) return false;

      return true;
    });
  }, [deEmpresa, busqueda, estadoFiltro, fechaDesde, fechaHasta]);

  const resetFiltros = () => {
    setBusqueda("");
    setEstadoFiltro("all");
    setFechaDesde("");
    setFechaHasta("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetFiltros();
      onClose();
    }
  };

  const hayFiltros =
    busqueda.trim() !== "" || estadoFiltro !== "all" || fechaDesde !== "" || fechaHasta !== "";

  return (
    <Dialog open={!!empresa} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] w-full lg:max-w-6xl max-h-[90vh] flex flex-col gap-4">
        <DialogHeader className="shrink-0">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-full bg-primary/10 grid place-items-center shrink-0">
              <UserRound className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display">Nómina de empleados</DialogTitle>
              <p className="admin-subtitle">
                Listado de empleados vinculados a{" "}
                <span className="font-medium text-foreground">{empresa?.nombre}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, documento, email o celular…"
              className="pl-10 h-11"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nomina-estado">Estado</Label>
              <Select
                value={estadoFiltro}
                onValueChange={(v) => setEstadoFiltro(v as EstadoFiltro)}
                disabled={loading}
              >
                <SelectTrigger id="nomina-estado" className="h-10 w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="suspendido">Suspendido</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nomina-desde">Fecha ingreso desde</Label>
              <Input
                id="nomina-desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-10"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nomina-hasta">Fecha ingreso hasta</Label>
              <Input
                id="nomina-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-10"
                disabled={loading}
                min={fechaDesde || undefined}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 shrink-0">
            {error}
          </p>
        )}

        <div className="admin-panel-card-flush flex-1 min-h-0 flex flex-col p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Cargando nómina…
            </div>
          ) : (
            <>
              <div className="overflow-x-auto overflow-y-auto flex-1">
                <table className="admin-table min-w-[1200px]">
                  <thead className="admin-table-head sticky top-0 z-10">
                    <tr>
                      <th className="admin-table-th text-left">Nombre</th>
                      <th className="admin-table-th text-left">Tipo doc.</th>
                      <th className="admin-table-th text-left">Documento</th>
                      <th className="admin-table-th text-right">Salario</th>
                      <th className="admin-table-th text-right">Saldo disponible</th>
                      <th className="admin-table-th text-right">Total adelantado</th>
                      <th className="admin-table-th text-right">Pagado</th>
                      <th className="admin-table-th text-left">Banco</th>
                      <th className="admin-table-th text-left">No. cuenta</th>
                      <th className="admin-table-th text-left">Tipo cuenta</th>
                      <th className="admin-table-th text-left">Email</th>
                      <th className="admin-table-th text-left">Celular</th>
                      <th className="admin-table-th text-left">Tipo contrato</th>
                      <th className="admin-table-th text-left">Ingreso</th>
                      <th className="admin-table-th text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lista.map((e) => {
                      const totalAdelantado = calcularTotalAdelantadoEmpleado(e, adelantos);
                      const totalPagado = calcularTotalPagadoEmpleado(e, adelantos, valorComision);
                      const saldoNeto = calcularSaldoDisponibleNeto(e, adelantos, valorComision);
                      const saldo =
                        e.saldoDisponibleApi != null && adelantos.length === 0
                          ? e.saldoDisponibleApi
                          : saldoNeto.saldoDisponible;
                      return (
                        <tr key={e.id} className="hover:bg-muted/30">
                          <td className="admin-table-cell-title whitespace-nowrap">{e.nombre}</td>
                          <td className="text-muted-foreground">{e.tipoDocumento}</td>
                          <td className="admin-table-cell-mono">{e.documento}</td>
                          <td className="text-right admin-table-cell-money !font-normal">
                            {formatCOP(e.salario)}
                          </td>
                          <td className="text-right admin-table-cell-money !font-normal text-primary">
                            {formatCOP(saldo)}
                          </td>
                          <td className="text-right admin-table-cell-money !font-normal">
                            {formatCOP(totalAdelantado)}
                          </td>
                          <td className="text-right admin-table-cell-money !font-normal text-success">
                            {formatCOP(totalPagado)}
                          </td>
                          <td className="text-muted-foreground">{e.banco}</td>
                          <td className="tabular admin-table-cell-mono">{e.numeroCuenta}</td>
                          <td className="text-muted-foreground">{e.tipoCuenta}</td>
                          <td className="text-muted-foreground">{e.email}</td>
                          <td className="tabular admin-table-cell-mono">{e.celular}</td>
                          <td className="text-muted-foreground whitespace-nowrap">{e.tipoContrato}</td>
                          <td className="tabular admin-table-cell-mono text-muted-foreground">
                            {fechaIngresoDia(e.fechaIngreso) ?? "—"}
                          </td>
                          <td>
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${estadoBadgeClass(e.estado)}`}
                            >
                              {labelEstado(e.estado)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {lista.length === 0 && (
                      <tr>
                        <td colSpan={15} className="admin-table-empty">
                          {hayFiltros
                            ? "No se encontraron empleados con esos filtros."
                            : "Esta empresa aún no tiene empleados registrados en nómina."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="admin-table-footer">
                {lista.length} de {deEmpresa.length} empleados mostrados
                {hayFiltros ? " · filtros activos" : ""}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
