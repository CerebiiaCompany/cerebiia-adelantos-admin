import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteConfiguracionPersonalizada,
  getConfiguracionesPersonalizadas,
  saveConfiguracionPersonalizada,
} from "@/lib/api/configuracion";
import { listarEmpresas } from "@/lib/api/empresas";
import { listarTodaNominaEmpresa } from "@/lib/api/empleados";
import { ApiError } from "@/lib/api/errors";
import type {
  ConfiguracionPersonalizada,
  EmpleadoAdminApi,
  EmpresaListItem,
} from "@/lib/api/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Percent,
  Plus,
  SlidersHorizontal,
  Trash2,
  User,
  Users,
} from "lucide-react";

interface PersonalizarPorcentajeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved?: () => void;
}

export function PersonalizarPorcentajeDialog({
  open,
  onOpenChange,
  onConfigSaved,
}: PersonalizarPorcentajeDialogProps) {
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [empleados, setEmpleados] = useState<EmpleadoAdminApi[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>("all");
  const [porcentaje, setPorcentaje] = useState<string>("");

  const [personalizadas, setPersonalizadas] = useState<ConfiguracionPersonalizada[]>([]);
  const [loadingPersonalizadas, setLoadingPersonalizadas] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar lista de empresas
  const loadEmpresas = useCallback(async () => {
    setLoadingEmpresas(true);
    try {
      const data = await listarEmpresas();
      setEmpresas(data);
    } catch {
      // Ignorar o registrar error
    } finally {
      setLoadingEmpresas(false);
    }
  }, []);

  // Cargar personalizaciones existentes
  const loadPersonalizadas = useCallback(async () => {
    setLoadingPersonalizadas(true);
    try {
      const data = await getConfiguracionesPersonalizadas();
      setPersonalizadas(data);
    } catch {
      // Si el endpoint aún no responde o da 404, mantener array vacío
      setPersonalizadas([]);
    } finally {
      setLoadingPersonalizadas(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadEmpresas();
      void loadPersonalizadas();
      setError(null);
      setSuccess(null);
    }
  }, [open, loadEmpresas, loadPersonalizadas]);

  // Cargar empleados al cambiar empresa
  useEffect(() => {
    if (!selectedEmpresaId) {
      setEmpleados([]);
      setSelectedEmpleadoId("all");
      return;
    }

    let isMounted = true;
    setLoadingEmpleados(true);
    setSelectedEmpleadoId("all");

    listarTodaNominaEmpresa(selectedEmpresaId)
      .then((data) => {
        if (!isMounted) return;
        // Ordenar alfabéticamente por nombre
        const sorted = [...data].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
        );
        setEmpleados(sorted);
      })
      .catch(() => {
        if (!isMounted) return;
        setEmpleados([]);
      })
      .finally(() => {
        if (isMounted) setLoadingEmpleados(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEmpresaId]);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresaId) {
      setError("Por favor selecciona una empresa.");
      return;
    }

    const pctNum = Number(porcentaje);
    if (isNaN(pctNum) || pctNum <= 0 || pctNum > 100) {
      setError("El porcentaje debe ser un número entre 0.01 y 100.00.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveConfiguracionPersonalizada({
        empresa_id: selectedEmpresaId,
        empleado_id: selectedEmpleadoId === "all" ? null : selectedEmpleadoId,
        porcentaje_maximo_adelanto: pctNum.toFixed(2),
      });

      setSuccess("Configuración personalizada guardada exitosamente.");
      setPorcentaje("");
      void loadPersonalizadas();
      onConfigSaved?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la configuración personalizada.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      await deleteConfiguracionPersonalizada(id);
      setSuccess("Configuración personalizada eliminada.");
      void loadPersonalizadas();
      onConfigSaved?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo eliminar la configuración personalizada.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrar o agrupar personalizaciones
  const filteredPersonalizadas = useMemo(() => {
    if (!selectedEmpresaId) return personalizadas;
    return personalizadas.filter((p) => p.empresa_id === selectedEmpresaId);
  }, [personalizadas, selectedEmpresaId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Personalizar % de adelanto</DialogTitle>
              <DialogDescription className="text-sm">
                Configura límites porcentuales específicos para una empresa completa o para un empleado individual.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-success rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5">
            <CheckCircle2 className="size-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Formulario de creación/actualización */}
        <form onSubmit={handleGuardar} className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 font-medium text-sm text-foreground">
            <Plus className="size-4 text-primary" />
            <span>Nueva regla personalizada</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Select Empresa */}
            <div className="space-y-1.5">
              <Label htmlFor="dialog-empresa" className="text-xs font-semibold">
                Empresa *
              </Label>
              <Select
                value={selectedEmpresaId}
                onValueChange={(val) => {
                  setSelectedEmpresaId(val);
                  setError(null);
                }}
                disabled={loadingEmpresas}
              >
                <SelectTrigger id="dialog-empresa" className="w-full">
                  <SelectValue placeholder={loadingEmpresas ? "Cargando empresas..." : "Seleccionar empresa"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        <span>{emp.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {empresas.length === 0 && !loadingEmpresas && (
                    <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                      No hay empresas registradas
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Select Empleado */}
            <div className="space-y-1.5">
              <Label htmlFor="dialog-empleado" className="text-xs font-semibold">
                Empleado *
              </Label>
              <Select
                value={selectedEmpleadoId}
                onValueChange={setSelectedEmpleadoId}
                disabled={!selectedEmpresaId || loadingEmpleados}
              >
                <SelectTrigger id="dialog-empleado" className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedEmpresaId
                        ? "Primero elige empresa"
                        : loadingEmpleados
                        ? "Cargando nómina..."
                        : "Seleccionar destinatario"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <Users className="size-3.5" />
                      <span>Todos (toda la empresa)</span>
                    </div>
                  </SelectItem>
                  {empleados.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{emp.nombre}</span>
                        <span className="text-xs text-muted-foreground">({emp.documento})</span>
                      </div>
                    </SelectItem>
                  ))}
                  {empleados.length === 0 && !loadingEmpleados && selectedEmpresaId && (
                    <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                      No hay empleados en nómina
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Input Porcentaje */}
            <div className="space-y-1.5">
              <Label htmlFor="dialog-porcentaje" className="text-xs font-semibold">
                % Máximo adelanto *
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="dialog-porcentaje"
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  placeholder="Ej. 25.00"
                  className="pl-8"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={saving || !selectedEmpresaId || !porcentaje}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando regla…
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Guardar regla personalizada
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Tabla de configuraciones existentes */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <span>Reglas activas configuradas</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {filteredPersonalizadas.length}
              </Badge>
            </h3>
            {selectedEmpresaId && personalizadas.length > filteredPersonalizadas.length && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setSelectedEmpresaId("")}
              >
                Ver todas las empresas
              </Button>
            )}
          </div>

          {loadingPersonalizadas ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground border rounded-lg">
              <Loader2 className="size-4 animate-spin" />
              Cargando reglas existentes…
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted/50 border-b text-muted-foreground text-left">
                    <tr>
                      <th className="px-3.5 py-2.5 font-medium">Empresa</th>
                      <th className="px-3.5 py-2.5 font-medium">Aplica a</th>
                      <th className="px-3.5 py-2.5 font-medium text-right">% Máx.</th>
                      <th className="px-3.5 py-2.5 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPersonalizadas.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3.5 py-2.5 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                            <span>{item.empresa_nombre || "Empresa"}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          {item.empleado_id ? (
                            <div className="flex items-center gap-1.5">
                              <User className="size-3.5 text-primary shrink-0" />
                              <div>
                                <span className="font-medium text-foreground">
                                  {item.empleado_nombre || "Empleado"}
                                </span>
                                {item.empleado_documento && (
                                  <span className="text-xs text-muted-foreground ml-1.5">
                                    (CC {item.empleado_documento})
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-primary/40 bg-primary/5 text-primary font-normal text-xs">
                              <Users className="size-3" />
                              Toda la empresa
                            </Badge>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-foreground">
                          {item.porcentaje_maximo_adelanto}%
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Eliminar regla personalizada"
                            disabled={deletingId === item.id}
                            onClick={() => handleEliminar(item.id)}
                            className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {filteredPersonalizadas.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                          No hay configuraciones personalizadas registradas
                          {selectedEmpresaId ? " para esta empresa" : ""}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
