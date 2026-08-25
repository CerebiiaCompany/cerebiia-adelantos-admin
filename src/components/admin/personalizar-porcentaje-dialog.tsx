import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
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
  Edit2,
  Loader2,
  Percent,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  User,
  Users,
} from "lucide-react";

export interface PersonalizarPorcentajeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmpresaId?: string;
  initialEmpleadoId?: string | null;
  initialPorcentaje?: number | string;
  editingConfig?: ConfiguracionPersonalizada | null;
  onConfigSaved?: () => void;
  onConfigDeleted?: () => void;
}

export function PersonalizarPorcentajeDialog({
  open,
  onOpenChange,
  initialEmpresaId,
  initialEmpleadoId,
  initialPorcentaje,
  editingConfig,
  onConfigSaved,
  onConfigDeleted,
}: PersonalizarPorcentajeDialogProps) {
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");
  const [aplicarAEmpleado, setAplicarAEmpleado] = useState<boolean>(false);
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>("");
  const [empleados, setEmpleados] = useState<EmpleadoAdminApi[]>([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(false);

  const [porcentaje, setPorcentaje] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

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
      // ignore
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
      setPersonalizadas([]);
    } finally {
      setLoadingPersonalizadas(false);
    }
  }, []);

  // Inicializar estado cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      void loadEmpresas();
      void loadPersonalizadas();
      setError(null);
      setSuccess(null);

      if (editingConfig) {
        setEditingId(editingConfig.id);
        setSelectedEmpresaId(editingConfig.empresa_id);
        if (editingConfig.empleado_id) {
          setAplicarAEmpleado(true);
          setSelectedEmpleadoId(editingConfig.empleado_id);
        } else {
          setAplicarAEmpleado(false);
          setSelectedEmpleadoId("");
        }
        setPorcentaje(String(editingConfig.porcentaje_maximo_adelanto));
      } else {
        setEditingId(null);
        if (initialEmpresaId) {
          setSelectedEmpresaId(initialEmpresaId);
        } else {
          setSelectedEmpresaId("");
        }

        if (initialEmpleadoId) {
          setAplicarAEmpleado(true);
          setSelectedEmpleadoId(initialEmpleadoId);
        } else {
          setAplicarAEmpleado(false);
          setSelectedEmpleadoId("");
        }

        if (initialPorcentaje !== undefined && initialPorcentaje !== "") {
          setPorcentaje(String(initialPorcentaje));
        } else {
          setPorcentaje("");
        }
      }
    }
  }, [
    open,
    editingConfig,
    initialEmpresaId,
    initialEmpleadoId,
    initialPorcentaje,
    loadEmpresas,
    loadPersonalizadas,
  ]);

  // Cargar empleados al cambiar empresa
  useEffect(() => {
    if (!selectedEmpresaId) {
      setEmpleados([]);
      if (!editingConfig && !initialEmpleadoId) {
        setSelectedEmpleadoId("");
      }
      return;
    }

    let isMounted = true;
    setLoadingEmpleados(true);

    listarTodaNominaEmpresa(selectedEmpresaId)
      .then((data) => {
        if (!isMounted) return;
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
  }, [selectedEmpresaId, editingConfig, initialEmpleadoId]);

  const handleStartEdit = (config: ConfiguracionPersonalizada) => {
    setEditingId(config.id);
    setSelectedEmpresaId(config.empresa_id);
    if (config.empleado_id) {
      setAplicarAEmpleado(true);
      setSelectedEmpleadoId(config.empleado_id);
    } else {
      setAplicarAEmpleado(false);
      setSelectedEmpleadoId("");
    }
    setPorcentaje(String(config.porcentaje_maximo_adelanto));
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPorcentaje("");
    if (!initialEmpresaId) {
      setSelectedEmpresaId("");
    }
    if (!initialEmpleadoId) {
      setAplicarAEmpleado(false);
      setSelectedEmpleadoId("");
    }
    setError(null);
    setSuccess(null);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpresaId) {
      setError("Por favor selecciona una empresa.");
      return;
    }

    if (aplicarAEmpleado && !selectedEmpleadoId) {
      setError("Por favor selecciona el empleado al que deseas aplicar la regla.");
      return;
    }

    const pctNum = Number(porcentaje);
    if (isNaN(pctNum) || pctNum < 1 || pctNum > 100) {
      setError("El porcentaje debe ser un número entre 1 y 100.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveConfiguracionPersonalizada({
        empresa_id: selectedEmpresaId,
        empleado_id: aplicarAEmpleado ? selectedEmpleadoId : null,
        porcentaje_maximo_adelanto: pctNum.toFixed(2),
      });

      const msg = "Configuración personalizada guardada exitosamente.";
      toast.success(msg);
      setSuccess(msg);
      setPorcentaje("");
      setEditingId(null);
      void loadPersonalizadas();
      onConfigSaved?.();
    } catch (err) {
      const errMsg =
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar la configuración personalizada.";
      setError(errMsg);
      toast.error(errMsg);
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
      const msg = "Configuración personalizada eliminada.";
      toast.success(msg);
      setSuccess(msg);
      if (editingId === id) {
        handleCancelEdit();
      }
      void loadPersonalizadas();
      onConfigDeleted?.();
      onConfigSaved?.();
    } catch (err) {
      const errMsg =
        err instanceof ApiError
          ? err.message
          : "No se pudo eliminar la configuración personalizada.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrar personalizaciones por empresa seleccionada
  const filteredPersonalizadas = useMemo(() => {
    if (!selectedEmpresaId) return personalizadas;
    return personalizadas.filter((p) => p.empresa_id === selectedEmpresaId);
  }, [personalizadas, selectedEmpresaId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {editingId ? "Editar porcentaje personalizado" : "Personalizar % de adelanto"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
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
        <form onSubmit={handleGuardar} className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-sm text-foreground">
              {editingId ? (
                <>
                  <Edit2 className="size-4 text-primary" />
                  <span>Modificar regla existente</span>
                </>
              ) : (
                <>
                  <Plus className="size-4 text-primary" />
                  <span>Nueva regla personalizada</span>
                </>
              )}
            </div>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3" />
                Cancelar edición
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Select Empresa */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="dialog-empresa" className="text-xs font-semibold">
                Empresa <span className="text-destructive">*</span>
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
                        <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">{emp.nombre}</span>
                        <span className="text-xs text-muted-foreground font-mono">({emp.nit})</span>
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

            {/* Switch: ¿Aplicar a un empleado específico? */}
            <div className="space-y-2 sm:col-span-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <Label htmlFor="switch-empleado" className="text-xs font-semibold cursor-pointer">
                    ¿Aplicar a un empleado específico?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {aplicarAEmpleado
                      ? "Se asignará un límite exclusivo para el empleado seleccionado."
                      : "Se aplicará a toda la nómina de la empresa seleccionada."}
                  </p>
                </div>
                <Switch
                  id="switch-empleado"
                  checked={aplicarAEmpleado}
                  onCheckedChange={(checked) => {
                    setAplicarAEmpleado(checked);
                    if (!checked) setSelectedEmpleadoId("");
                  }}
                />
              </div>

              {/* Selector de Empleado condicional */}
              {aplicarAEmpleado && (
                <div className="pt-2 border-t border-border/50 space-y-1.5">
                  <Label htmlFor="dialog-empleado" className="text-xs font-semibold">
                    Empleado destinatario <span className="text-destructive">*</span>
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
                            ? "Primero selecciona una empresa"
                            : loadingEmpleados
                            ? "Cargando empleados..."
                            : "Seleccionar empleado..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {empleados.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          <div className="flex items-center gap-2">
                            <User className="size-3.5 text-primary shrink-0" />
                            <span className="truncate max-w-[220px] font-medium">{emp.nombre}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({emp.documento})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {empleados.length === 0 && !loadingEmpleados && selectedEmpresaId && (
                        <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                          No hay empleados en esta empresa
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Input Porcentaje */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dialog-porcentaje" className="text-xs font-semibold">
                  % Máximo de adelanto permitido <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  {[20, 30, 40, 50, 70].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPorcentaje(String(preset))}
                      className={`h-6 text-[11px] px-2 ${
                        Number(porcentaje) === preset ? "border-primary bg-primary/10 text-primary font-bold" : ""
                      }`}
                    >
                      {preset}%
                    </Button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="dialog-porcentaje"
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  max="100"
                  placeholder="Ej. 50.00"
                  className="pl-9 text-base font-semibold"
                  value={porcentaje}
                  onChange={(e) => setPorcentaje(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Define el porcentaje máximo del salario disponible que el destinatario podrá solicitar (1 a 100%).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {editingId && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                saving ||
                !selectedEmpresaId ||
                !porcentaje ||
                (aplicarAEmpleado && !selectedEmpleadoId)
              }
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {editingId ? "Actualizando…" : "Guardando…"}
                </>
              ) : (
                <>
                  {editingId ? <CheckCircle2 className="size-4" /> : <Plus className="size-4" />}
                  {editingId ? "Actualizar regla" : "Guardar regla personalizada"}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Tabla de configuraciones existentes */}
        <div className="space-y-3 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Reglas activas configuradas</h3>
              <Badge variant="secondary" className="font-mono text-xs">
                {filteredPersonalizadas.length}
              </Badge>
            </div>
            {selectedEmpresaId && personalizadas.length > filteredPersonalizadas.length && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => setSelectedEmpresaId("")}
              >
                Ver todas las empresas ({personalizadas.length})
              </Button>
            )}
          </div>

          {loadingPersonalizadas ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground border rounded-lg">
              <Loader2 className="size-4 animate-spin" />
              Cargando reglas existentes…
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-muted/50 border-b text-muted-foreground text-left">
                    <tr>
                      <th className="px-3.5 py-2.5 font-medium">Tipo</th>
                      <th className="px-3.5 py-2.5 font-medium">Empresa</th>
                      <th className="px-3.5 py-2.5 font-medium">Aplica a</th>
                      <th className="px-3.5 py-2.5 font-medium text-right">% Asignado</th>
                      <th className="px-3.5 py-2.5 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPersonalizadas.map((item) => {
                      const isEmpleado = Boolean(item.empleado_id);
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            editingId === item.id ? "bg-primary/5 font-medium" : ""
                          }`}
                        >
                          <td className="px-3.5 py-2.5">
                            {isEmpleado ? (
                              <Badge
                                variant="secondary"
                                className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px]"
                              >
                                <User className="size-3" />
                                Empleado
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[11px]"
                              >
                                <Building2 className="size-3" />
                                Empresa
                              </Badge>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {item.empresa_nombre || "Empresa"}
                              </span>
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
                                    <span className="text-xs text-muted-foreground ml-1.5 font-mono">
                                      ({item.empleado_documento})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Users className="size-3.5" />
                                Toda la empresa
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-bold text-primary">
                            {item.porcentaje_maximo_adelanto}%
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title="Editar regla"
                                onClick={() => handleStartEdit(item)}
                                className="size-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredPersonalizadas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
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
