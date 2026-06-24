import { useMemo, useState } from "react";
import type { Adelanto, Empresa, Empleado } from "@/lib/admin-store";
import { calcularSaldoDisponible, calcularTotalAdelantadoEmpleado, formatCOP } from "@/lib/admin-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, UserRound } from "lucide-react";

type EmpresaNominaDialogProps = {
  empresa: Empresa | null;
  empleados: Empleado[];
  adelantos: Adelanto[];
  onClose: () => void;
};

export function EmpresaNominaDialog({ empresa, empleados, adelantos, onClose }: EmpresaNominaDialogProps) {
  const [busqueda, setBusqueda] = useState("");

  const lista = useMemo(() => {
    if (!empresa) return [];
    const q = busqueda.trim().toLowerCase();
    return empleados
      .filter((e) => e.empresaId === empresa.id)
      .filter((e) => {
        if (!q) return true;
        return (
          e.nombre.toLowerCase().includes(q) ||
          e.documento.includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.celular.includes(q)
        );
      });
  }, [empresa, empleados, busqueda]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setBusqueda("");
      onClose();
    }
  };

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

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, documento, email o celular…"
            className="pl-10 h-11"
          />
        </div>

        <div className="admin-panel-card-flush flex-1 min-h-0 flex flex-col p-0">
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
                  <th className="admin-table-th text-left">Banco</th>
                  <th className="admin-table-th text-left">No. cuenta</th>
                  <th className="admin-table-th text-left">Tipo cuenta</th>
                  <th className="admin-table-th text-left">Email</th>
                  <th className="admin-table-th text-left">Celular</th>
                  <th className="admin-table-th text-left">Tipo contrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lista.map((e) => {
                  const totalAdelantado = calcularTotalAdelantadoEmpleado(e, adelantos);
                  return (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="admin-table-cell-title whitespace-nowrap">{e.nombre}</td>
                    <td className="text-muted-foreground">{e.tipoDocumento}</td>
                    <td className="admin-table-cell-mono">{e.documento}</td>
                    <td className="text-right admin-table-cell-money">{formatCOP(e.salario)}</td>
                    <td className="text-right admin-table-cell-money text-primary">
                      {formatCOP(calcularSaldoDisponible(e.salario))}
                    </td>
                    <td className="text-right admin-table-cell-money">
                      {formatCOP(totalAdelantado)}
                    </td>
                    <td className="text-muted-foreground">{e.banco}</td>
                    <td className="tabular admin-table-cell-mono">{e.numeroCuenta}</td>
                    <td className="text-muted-foreground">{e.tipoCuenta}</td>
                    <td className="text-muted-foreground">{e.email}</td>
                    <td className="tabular admin-table-cell-mono">{e.celular}</td>
                    <td className="text-muted-foreground whitespace-nowrap">{e.tipoContrato}</td>
                  </tr>
                  );
                })}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={12} className="admin-table-empty">
                      {busqueda
                        ? "No se encontraron empleados con ese criterio."
                        : "Esta empresa aún no tiene empleados registrados en nómina."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-table-footer">
            {lista.length} de {empleados.filter((e) => e.empresaId === empresa?.id).length} empleados
            mostrados · Saldo disponible = 30% del salario
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
