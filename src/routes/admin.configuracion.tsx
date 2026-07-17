import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { comisionFromConfiguracion, updateComision } from "@/lib/api/comision";
import {
  getConfiguracion,
  getConfiguracionHistorial,
  updateConfiguracion,
} from "@/lib/api/configuracion";
import { ApiError } from "@/lib/api/errors";
import { writeComisionCache, readComisionCache, DEFAULT_COMISION_VALOR } from "@/lib/adelanto-calculo";
import type { ConfiguracionGlobal, HistorialConfiguracion } from "@/lib/api/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { useModuleAnimationKey } from "@/hooks/use-module-animation-key";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Coins, Save, Percent, CalendarDays, Hash, Banknote } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const [comisionError, setComisionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comisionSuccess, setComisionSuccess] = useState<string | null>(null);

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

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setComisionError(null);

    const results = await Promise.allSettled([getConfiguracion(), getConfiguracionHistorial()]);
    const [cfgResult, histResult] = results;

    if (cfgResult.status === "fulfilled") {
      applyConfigToForms(cfgResult.value);
    } else {
      const err = cfgResult.reason;
      if (err instanceof ApiError && err.status === 500) {
        setError(
          "El servidor no pudo cargar la configuración (error 500). Suele deberse a que falta aplicar la migración de base de datos `0002_tarifa_fija_por_cuota`. En el backend ejecuta: python src/manage.py migrate",
        );
      } else {
        setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración de adelantos.");
      }
      setComisionForm({ valor_comision: readComisionCache() ?? DEFAULT_COMISION_VALOR });
    }

    if (histResult.status === "fulfilled") {
      setHistorial(histResult.value);
    }

    setLoading(false);
  }, [applyConfigToForms]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const buildPayload = () => ({
    porcentaje_maximo_adelanto: form.porcentaje_maximo_adelanto,
    numero_maximo_cuotas: Number(form.numero_maximo_cuotas),
    plazo_maximo_dias: Number(form.plazo_maximo_dias),
    tarifa_fija_por_cuota: tarifaToApiValue(comisionForm.valor_comision || "0"),
    monto_minimo: tarifaToApiValue(form.monto_minimo || "0"),
  });

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
      setSuccess("Configuración guardada correctamente.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la configuración.");
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
      setComisionSuccess("Comisión actualizada correctamente.");
    } catch (err) {
      setComisionError(err instanceof ApiError ? err.message : "No se pudo guardar la comisión.");
    } finally {
      setSavingComision(false);
    }
  };

  return (
    <div className="admin-page space-y-6">
      <AdminPageHeader
        eyebrow="Parámetros"
        title="Configuración de adelantos"
        subtitle="Límites globales, monto mínimo y tarifa fija por cuota desde el backend."
      />

      {loading ? (
        <div className="admin-panel-card flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Cargando configuración…
        </div>
      ) : (
        <>
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

          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            <form onSubmit={submit} className="admin-panel-card h-full flex flex-col space-y-5">
              <div>
                <h2 className="admin-section-title text-lg">Límites de adelanto</h2>
                <p className="admin-section-subtitle text-base mt-1">
                  Porcentaje, cuotas, plazo y monto mínimo para solicitudes.
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
                  <p className="text-xs text-muted-foreground">Entre 0.01 y 100.00</p>
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
                  <p className="text-xs text-muted-foreground">Valor mínimo que puede solicitar un empleado</p>
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
              </div>
            </form>

            <form onSubmit={submitComision} className="admin-panel-card h-full flex flex-col space-y-5">
              <div>
                <h2 className="admin-section-title text-lg">Comisión por cuota</h2>
                <p className="admin-section-subtitle text-base mt-1">
                  Tarifa fija en pesos cobrada por cada cuota (campo `tarifa_fija_por_cuota` en configuración).
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
                    className="pl-9"
                    placeholder="Ej. 8000"
                    value={comisionForm.valor_comision}
                    onChange={(e) =>
                      setComisionForm({ valor_comision: e.target.value.replace(/\D/g, "") })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Comisión total del adelanto = tarifa × número de cuotas.
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

          <div className="admin-panel-card-flush">
            <div className="admin-card-toolbar">
              <h2 className="admin-section-title text-lg">Historial de cambios</h2>
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
                      <td className="hidden md:table-cell admin-table-cell-mono text-xs">
                        {row.actualizado_por ?? "—"}
                      </td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={7} className="admin-table-empty">
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
    </div>
  );
}
