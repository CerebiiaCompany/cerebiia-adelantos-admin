import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { comisionFromConfiguracion, updateComision } from "@/lib/api/comision";
import {
  deleteConfiguracionPersonalizada,
  getConfiguracion,
  getConfiguracionHistorial,
  getConfiguracionesPersonalizadas,
  updateConfiguracion,
} from "@/lib/api/configuracion";
import { listarEmpresas } from "@/lib/api/empresas";
import { ApiError } from "@/lib/api/errors";
import { writeComisionCache, readComisionCache, DEFAULT_COMISION_VALOR } from "@/lib/adelanto-calculo";
import type {
  ConfiguracionGlobal,
  ConfiguracionPersonalizada,
  EmpresaListItem,
  HistorialConfiguracion,
} from "@/lib/api/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { useModuleAnimationKey } from "@/hooks/use-module-animation-key";
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
  Loader2,
  Coins,
  Save,
  Percent,
  CalendarDays,
  Hash,
  Banknote,
  SlidersHorizontal,
  Building2,
  Globe,
  Plus,
  Edit2,
  Trash2,
  User,
  Users,
  Search,
} from "lucide-react";
import { PersonalizarPorcentajeDialog } from "@/components/admin/personalizar-porcentaje-dialog";

export const Route = createFileRoute("/admin/configuracion")({
  head: () => ({ meta: [{ title: "Configuración — Panel" }] }),
  component: ConfiguracionPage,
});

function tarifaToFormValue(tarifa: string): string {
  return tarifa.replace(/\.00$/, "") || "0";
}

function tarifaToApiValue(valor: string): string {
  return valor.includes(".") ? valor : `${valor}.00`;
}

function ConfiguracionPage() {
  const animationKey = useModuleAnimationKey();
  const [config, setConfig] = useState<ConfiguracionGlobal | null>(null);
  const [historial, setHistorial] = useState<HistorialConfiguracion[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
  const [personalizadas, setPersonalizadas] = useState<ConfiguracionPersonalizada[]>([]);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("global");
  const [reglasSearch, setReglasSearch] = useState<string>("");
  const [reglasTipoFiltro, setReglasTipoFiltro] = useState<"all" | "empresa" | "empleado">("all");

  const [form, setForm] = useState({
    porcentaje_maximo_adelanto: "",
    numero_maximo_cuotas: "",
    plazo_maximo_dias: "",
    monto_minimo: "",
  });
  const [comisionForm, setComisionForm] = useState({ valor_comision: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingComision, setSavingComision] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comisionError, setComisionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comisionSuccess, setComisionSuccess] = useState<string | null>(null);

  // Modal de Personalización
  const [personalizarOpen, setPersonalizarOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ConfiguracionPersonalizada | null>(null);

  const applyConfigToForms = useCallback((cfg: ConfiguracionGlobal) => {
    setConfig(cfg);
    setForm({
      porcentaje_maximo_adelanto: cfg.porcentaje_maximo_adelanto,
      numero_maximo_cuotas: String(cfg.numero_maximo_cuotas),
      plazo_maximo_dias: String(cfg.plazo_maximo_dias),
      monto_minimo: tarifaToFormValue(cfg.monto_minimo),
    });
    const valor = comisionFromConfiguracion(cfg).valor_comision;
    setComisionForm({ valor_comision: valor });
    writeComisionCache(valor);
  }, []);

  const loadAll = useCallback(async (empresaIdToLoad?: string) => {
    setLoading(true);
    setError(null);
    setComisionError(null);

    const activeId = empresaIdToLoad !== undefined ? empresaIdToLoad : selectedEmpresaId;
    const targetEmpresaId = activeId === "global" || !activeId ? undefined : activeId;

    const results = await Promise.allSettled([
      getConfiguracion(targetEmpresaId),
      getConfiguracionHistorial(),
      listarEmpresas(),
      getConfiguracionesPersonalizadas(),
    ]);
    const [cfgResult, histResult, empResult, persResult] = results;

    if (cfgResult.status === "fulfilled") {
      applyConfigToForms(cfgResult.value);
    } else {
      const err = cfgResult.reason;
      if (err instanceof ApiError && err.status === 500) {
        setError(
          "El servidor no pudo cargar la configuración (error 500). Verifica las migraciones de base de datos.",
        );
      } else {
        setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración de adelantos.");
      }
      setComisionForm({ valor_comision: readComisionCache() ?? DEFAULT_COMISION_VALOR });
    }

    if (histResult.status === "fulfilled") {
      const sorted = [...histResult.value].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setHistorial(sorted);
    }

    if (empResult.status === "fulfilled") {
      setEmpresas(empResult.value);
    }

    if (persResult.status === "fulfilled") {
      setPersonalizadas(persResult.value);
    } else {
      setPersonalizadas([]);
    }

    setLoading(false);
  }, [applyConfigToForms, selectedEmpresaId]);

  useEffect(() => {
    void loadAll(selectedEmpresaId);
  }, [selectedEmpresaId, loadAll]);

  const buildPayload = () => {
    const rawPct = String(form.porcentaje_maximo_adelanto || "30").replace(",", ".").trim();
    const cleanPct = isNaN(Number(rawPct)) ? "30.00" : Number(rawPct).toFixed(2);
    const rawComision = String(comisionForm.valor_comision || "0").replace(",", ".").trim();
    const rawMontoMin = String(form.monto_minimo || "0").replace(",", ".").trim();

    return {
      porcentaje_maximo_adelanto: cleanPct,
      numero_maximo_cuotas: Number(form.numero_maximo_cuotas) || 3,
      plazo_maximo_dias: Number(form.plazo_maximo_dias) || 90,
      tarifa_fija_por_cuota: tarifaToApiValue(rawComision),
      monto_minimo: tarifaToApiValue(rawMontoMin),
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateConfiguracion(buildPayload());
      applyConfigToForms(updated);
      const hist = await getConfiguracionHistorial();
      setHistorial(hist);
      const msg = "Configuración guardada correctamente.";
      setSuccess(msg);
      toast.success(msg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo guardar la configuración.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const submitComision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingComision(true);
    setComisionError(null);
    setComisionSuccess(null);

    const valor = comisionForm.valor_comision.trim();
    if (!/^\d+$/.test(valor)) {
      setComisionError("Ingresa un valor entero en pesos (sin decimales).");
      setSavingComision(false);
      return;
    }

    writeComisionCache(valor);

    if (!config) {
      setComisionSuccess("Comisión guardada localmente. Se aplicará en los cálculos del panel.");
      setSavingComision(false);
      return;
    }

    try {
      const updated = await updateComision({ valor_comision: valor }, config);
      applyConfigToForms({
        ...config,
        tarifa_fija_por_cuota: tarifaToApiValue(updated.valor_comision),
        updated_at: updated.updated_at,
      });
      const hist = await getConfiguracionHistorial();
      setHistorial(hist);
      const msg = "Comisión actualizada correctamente.";
      setComisionSuccess(msg);
      toast.success(msg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo guardar la comisión.";
      setComisionError(msg);
      toast.error(msg);
    } finally {
      setSavingComision(false);
    }
  };

  const handleEliminarRegla = async (id: string) => {
    setDeletingRuleId(id);
    try {
      await deleteConfiguracionPersonalizada(id);
      toast.success("Configuración personalizada eliminada.");
      void loadAll();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "No se pudo eliminar la configuración personalizada.",
      );
    } finally {
      setDeletingRuleId(null);
    }
  };

  const openNewCustomRuleModal = () => {
    setEditingRule(null);
    setPersonalizarOpen(true);
  };

  const openEditCustomRuleModal = (rule: ConfiguracionPersonalizada) => {
    setEditingRule(rule);
    setPersonalizarOpen(true);
  };

  // Filtrado de reglas personalizadas
  const filteredPersonalizadas = useMemo(() => {
    const q = reglasSearch.trim().toLowerCase();
    return personalizadas.filter((r) => {
      if (reglasTipoFiltro === "empresa" && r.empleado_id) return false;
      if (reglasTipoFiltro === "empleado" && !r.empleado_id) return false;

      if (!q) return true;
      const matchEmpresa = (r.empresa_nombre || "").toLowerCase().includes(q);
      const matchEmpleado = (r.empleado_nombre || "").toLowerCase().includes(q);
      const matchDoc = (r.empleado_documento || "").toLowerCase().includes(q);
      return matchEmpresa || matchEmpleado || matchDoc;
    });
  }, [personalizadas, reglasSearch, reglasTipoFiltro]);

  return (
    <div className="admin-page space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AdminPageHeader
          eyebrow="Parámetros"
          title="Configuración de adelantos"
          subtitle="Jerarquía dinámica: 1º Empleado > 2º Empresa > 3º Global. Límites, tarifas y reglas personalizadas."
        />

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="w-64 sm:w-72">
            <Select
              value={selectedEmpresaId}
              onValueChange={(val) => {
                setSelectedEmpresaId(val);
                setError(null);
                setSuccess(null);
              }}
            >
              <SelectTrigger className="w-full h-9 bg-card border shadow-xs text-xs sm:text-sm">
                <SelectValue placeholder="Configuración global" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="global">
                  <div className="flex items-center gap-2 font-medium">
                    <Globe className="size-3.5 text-primary" />
                    <span>Configuración Global</span>
                  </div>
                </SelectItem>
                {empresas.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{emp.nombre}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={openNewCustomRuleModal}
            className="gap-1.5 h-9 shrink-0 shadow-xs"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Personalizar %</span>
          </Button>
        </div>
      </div>

      {/* Banner de Origen de Configuración cuando se filtra por empresa */}
      {selectedEmpresaId && selectedEmpresaId !== "global" && config && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border bg-card/80 backdrop-blur-xs shadow-xs text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Building2 className="size-4" />
            </div>
            <div>
              <span className="font-medium text-foreground">
                Configuración efectiva para:{" "}
                <strong>
                  {empresas.find((e) => e.id === selectedEmpresaId)?.nombre || "Empresa seleccionada"}
                </strong>
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.origen === "empresa" || config.origen === "empleado" ? (
                  <>
                    Aplica regla <strong>personalizada ({config.origen})</strong> con límite de{" "}
                    <strong>{config.porcentaje_maximo_adelanto}%</strong>.{" "}
                    {config.porcentaje_global && (
                      <span className="text-muted-foreground">
                        (Límite global por defecto: {config.porcentaje_global}%)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Hereda el límite <strong>global del sistema ({config.porcentaje_maximo_adelanto}%)</strong>.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={config.origen && config.origen !== "global" ? "default" : "outline"}
              className="text-xs uppercase font-semibold"
            >
              {config.origen === "empresa"
                ? "Regla Empresa"
                : config.origen === "empleado"
                ? "Regla Empleado"
                : "Global"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEmpresaId("global")}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Ver global
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-panel-card flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Cargando configuración…
        </div>
      ) : (
        <>
          {/* Métricas clave */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <AdminMetricCard
              label="% máximo adelanto"
              icon={Percent}
              iconTone="trending"
              value={
                <AnimatedNumber
                  value={Number(form.porcentaje_maximo_adelanto) || 0}
                  animationKey={animationKey}
                  delay={0}
                />
              }
              sub="del salario disponible"
              accent
            />
            <AdminMetricCard
              label="Monto mínimo"
              icon={Banknote}
              iconTone="wallet"
              value={
                <AnimatedNumber
                  value={Number(form.monto_minimo) || 0}
                  format="currency"
                  animationKey={animationKey}
                  delay={60}
                />
              }
            />
            <AdminMetricCard
              label="Máx. cuotas"
              icon={Hash}
              iconTone="building"
              value={
                <AnimatedNumber
                  value={Number(form.numero_maximo_cuotas) || 0}
                  animationKey={animationKey}
                  delay={120}
                />
              }
            />
            <AdminMetricCard
              label="Plazo máximo"
              icon={CalendarDays}
              iconTone="default"
              value={
                <AnimatedNumber
                  value={Number(form.plazo_maximo_dias) || 0}
                  animationKey={animationKey}
                  delay={180}
                />
              }
              sub="días"
            />
            <AdminMetricCard
              label="Tarifa por cuota"
              icon={Coins}
              iconTone="success"
              value={
                <AnimatedNumber
                  value={Number(comisionForm.valor_comision) || 0}
                  format="currency"
                  animationKey={animationKey}
                  delay={240}
                />
              }
            />
          </section>

          {/* Formularios de Configuración Global */}
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <form onSubmit={submit} className="admin-panel-card h-full flex flex-col space-y-5">
              <div>
                <h2 className="admin-section-title text-lg">Límites de adelanto</h2>
                <p className="admin-section-subtitle text-base mt-1">
                  Porcentaje global por defecto, cuotas, plazo y monto mínimo para solicitudes.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-sm text-success rounded-lg border border-success/30 bg-success/10 px-3 py-2">
                  {success}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                <div className="space-y-1.5">
                  <Label htmlFor="porcentaje">% máximo adelanto</Label>
                  <Input
                    id="porcentaje"
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={form.porcentaje_maximo_adelanto}
                    onChange={(e) => setForm({ ...form, porcentaje_maximo_adelanto: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Por defecto: 30.00%</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monto-minimo">Monto mínimo (COP)</Label>
                  <Input
                    id="monto-minimo"
                    required
                    type="number"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    value={form.monto_minimo}
                    onChange={(e) =>
                      setForm({ ...form, monto_minimo: e.target.value.replace(/[^\d]/g, "") })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Valor mínimo por solicitud</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cuotas">Máx. cuotas</Label>
                  <Input
                    id="cuotas"
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.numero_maximo_cuotas}
                    onChange={(e) => setForm({ ...form, numero_maximo_cuotas: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plazo">Plazo máximo (días)</Label>
                  <Input
                    id="plazo"
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.plazo_maximo_dias}
                    onChange={(e) => setForm({ ...form, plazo_maximo_dias: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-auto space-y-4 pt-2">
                {config && (
                  <p className="text-sm text-muted-foreground">
                    Última actualización:{" "}
                    {new Date(config.updated_at).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={saving || !config} className="w-full sm:w-auto">
                    {saving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Guardando…
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-2" />
                        Guardar límites
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openNewCustomRuleModal}
                    className="w-full sm:w-auto gap-2"
                  >
                    <SlidersHorizontal className="size-4" />
                    Personalizar %
                  </Button>
                </div>
              </div>
            </form>

            <form onSubmit={submitComision} className="admin-panel-card h-full flex flex-col space-y-5">
              <div>
                <h2 className="admin-section-title text-lg">Comisión por cuota</h2>
                <p className="admin-section-subtitle text-base mt-1">
                  Tarifa fija en pesos cobrada por cada cuota de adelanto.
                </p>
              </div>

              {comisionError && (
                <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                  {comisionError}
                </p>
              )}
              {comisionSuccess && (
                <p className="text-sm text-success rounded-lg border border-success/30 bg-success/10 px-3 py-2">
                  {comisionSuccess}
                </p>
              )}

              <div className="space-y-1.5 flex-1">
                <Label htmlFor="comision">Tarifa fija por cuota (COP)</Label>
                <div className="relative max-w-md">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="comision"
                    required
                    type="number"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    className="pl-9 font-semibold"
                    placeholder="Ej. 8000"
                    value={comisionForm.valor_comision}
                    onChange={(e) =>
                      setComisionForm({ valor_comision: e.target.value.replace(/\D/g, "") })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Comisión total del adelanto = tarifa fija × número de cuotas elegidas.
                </p>
              </div>

              <div className="mt-auto space-y-4 pt-2">
                {config && (
                  <p className="text-sm text-muted-foreground">
                    Valor en servidor: {tarifaToFormValue(config.tarifa_fija_por_cuota)} COP
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={savingComision || comisionForm.valor_comision === "" || !config}
                  className="w-full sm:w-auto"
                >
                  {savingComision ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-2" />
                      Guardar comisión
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* SECCIÓN DEDICADA: Tabla de Reglas Personalizadas Activas */}
          <div className="admin-panel-card-flush space-y-0">
            <div className="p-4 sm:p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <SlidersHorizontal className="size-4" />
                  </div>
                  <div>
                    <h2 className="admin-section-title text-lg flex items-center gap-2">
                      <span>Reglas Personalizadas Activas</span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {personalizadas.length}
                      </Badge>
                    </h2>
                    <p className="admin-section-subtitle text-xs sm:text-sm">
                      Porcentajes individuales por empresa o empleado con prioridad sobre el {Number(config?.porcentaje_maximo_adelanto ?? 30)}% global.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar empresa o empleado…"
                    value={reglasSearch}
                    onChange={(e) => setReglasSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <Select
                  value={reglasTipoFiltro}
                  onValueChange={(v) => setReglasTipoFiltro(v as "all" | "empresa" | "empleado")}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="empresa">Solo Empresas</SelectItem>
                    <SelectItem value="empleado">Solo Empleados</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  size="sm"
                  onClick={openNewCustomRuleModal}
                  className="h-8 text-xs gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>Nueva regla</span>
                </Button>
              </div>
            </div>

            <div className="admin-table-scroll">
              <table className="admin-table min-w-[50rem]">
                <thead className="admin-table-head">
                  <tr>
                    <th className="admin-table-th text-left">Tipo</th>
                    <th className="admin-table-th text-left">Empresa</th>
                    <th className="admin-table-th text-left">Destinatario (Empleado / Nómina)</th>
                    <th className="admin-table-th text-right">% Asignado</th>
                    <th className="admin-table-th text-left">Última actualización</th>
                    <th className="admin-table-th text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPersonalizadas.map((rule) => {
                    const isEmpleado = Boolean(rule.empleado_id);
                    return (
                      <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                        <td className="text-left">
                          {isEmpleado ? (
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold"
                            >
                              <User className="size-3" />
                              Empleado
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-semibold"
                            >
                              <Building2 className="size-3" />
                              Empresa
                            </Badge>
                          )}
                        </td>
                        <td className="text-left font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="size-4 text-muted-foreground shrink-0" />
                            <span className="text-sm text-foreground">{rule.empresa_nombre || "Empresa"}</span>
                          </div>
                        </td>
                        <td className="text-left">
                          {rule.empleado_id ? (
                            <div className="flex items-center gap-2">
                              <User className="size-3.5 text-primary shrink-0" />
                              <div>
                                <span className="font-medium text-foreground">
                                  {rule.empleado_nombre || "Empleado individual"}
                                </span>
                                {rule.empleado_documento && (
                                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                                    (CC {rule.empleado_documento})
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1 text-xs border-primary/40 bg-primary/5 text-primary font-medium"
                            >
                              <Users className="size-3" />
                              Toda la empresa
                            </Badge>
                          )}
                        </td>
                        <td className="text-right tabular font-mono font-bold text-base text-primary">
                          {rule.porcentaje_maximo_adelanto}%
                        </td>
                        <td className="text-left tabular text-xs text-muted-foreground">
                          {rule.updated_at
                            ? new Date(rule.updated_at).toLocaleString("es-CO", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : rule.created_at
                            ? new Date(rule.created_at).toLocaleString("es-CO", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Editar porcentaje"
                              onClick={() => openEditCustomRuleModal(rule)}
                              className="size-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Edit2 className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Eliminar regla (volver a nivel superior)"
                              disabled={deletingRuleId === rule.id}
                              onClick={() => handleEliminarRegla(rule.id)}
                              className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingRuleId === rule.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredPersonalizadas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-table-empty">
                        {reglasSearch || reglasTipoFiltro !== "all"
                          ? "No hay reglas personalizadas que coincidan con los filtros."
                          : "No hay reglas personalizadas activas. Todas las empresas y empleados utilizan el límite global."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historial de cambios */}
          <div className="admin-panel-card-flush">
            <div className="admin-card-toolbar">
              <h2 className="admin-section-title text-lg">Historial de cambios de configuración</h2>
              <span className="text-sm text-muted-foreground">{historial.length} registros</span>
            </div>
            <div className="admin-table-scroll">
              <table className="admin-table min-w-[40rem]">
                <thead className="admin-table-head">
                  <tr>
                    <th className="admin-table-th text-left">Fecha</th>
                    <th className="admin-table-th text-right">% adelanto</th>
                    <th className="admin-table-th text-right">Monto mín.</th>
                    <th className="admin-table-th text-right">Cuotas</th>
                    <th className="admin-table-th text-right">Plazo (días)</th>
                    <th className="admin-table-th text-right">Tarifa/cuota</th>
                    <th className="admin-table-th text-left">Actualizado a</th>
                    <th className="admin-table-th text-left hidden md:table-cell">Actualizado por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historial.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="tabular text-muted-foreground">
                        {new Date(row.timestamp).toLocaleString("es-CO", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="text-right tabular font-medium">{row.porcentaje_maximo_adelanto}%</td>
                      <td className="text-right tabular">
                        {tarifaToFormValue(row.monto_minimo ?? "0")} COP
                      </td>
                      <td className="text-right tabular">{row.numero_maximo_cuotas}</td>
                      <td className="text-right tabular">{row.plazo_maximo_dias}</td>
                      <td className="text-right tabular">
                        {tarifaToFormValue(row.tarifa_fija_por_cuota)} COP
                      </td>
                      <td className="text-left text-xs">
                        {row.actualizado_a ? (
                          <span className="font-medium text-foreground">{row.actualizado_a}</span>
                        ) : row.empresa_nombre ? (
                          <span className="font-medium text-foreground">
                            {row.empresa_nombre}
                            {row.empleado_nombre ? ` (${row.empleado_nombre})` : ""}
                          </span>
                        ) : row.aplica_a ? (
                          <span className="font-medium text-foreground">{row.aplica_a}</span>
                        ) : (
                          <span className="text-muted-foreground">Global</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell admin-table-cell-mono text-xs">
                        {row.actualizado_por ?? "—"}
                      </td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={8} className="admin-table-empty">
                        Aún no hay cambios registrados en el historial.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <PersonalizarPorcentajeDialog
        open={personalizarOpen}
        onOpenChange={(open) => {
          setPersonalizarOpen(open);
          if (!open) setEditingRule(null);
        }}
        editingConfig={editingRule}
        onConfigSaved={loadAll}
        onConfigDeleted={loadAll}
      />
    </div>
  );
}
