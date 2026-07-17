import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCOP } from "@/lib/admin-store";
import {
  adjuntarDocumentoCobro,
  crearCuentaCobro,
  getControlPagos,
  getControlPagosPeriodos,
  getReferenciaNomina,
  listCuentasCobro,
  rechazarEvidenciaCobro,
  registrarEvidenciaCobro,
  verificarCuentaCobro,
} from "@/lib/api/admin";
import { listarEmpresas } from "@/lib/api/empresas";
import { ApiError } from "@/lib/api/errors";
import type {
  ControlPagoEmpresaApi,
  ControlPagosPeriodoApi,
  CuentaCobroApi,
  EmpresaListItem,
  EstadoCuentaCobroApi,
} from "@/lib/api/types";
import { estadoCuentaCobroLabel, ESTADO_CUENTA_COBRO_CLASSES } from "@/lib/cuenta-cobro";
import { exportReferenciaNominaExcel } from "@/lib/export-referencia-nomina-excel";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { useModuleAnimationKey } from "@/hooks/use-module-animation-key";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Landmark, Loader2, Banknote, ListChecks, FileUp, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/admin/control-pagos")({
  head: () => ({ meta: [{ title: "Control de pagos — Panel" }] }),
  component: ControlPagosPage,
});

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function currentPeriodValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function toPeriodOption(p: ControlPagosPeriodoApi) {
  return {
    value: p.periodo,
    label: `${MESES[p.mes - 1]} ${p.anio}${p.es_actual ? " (actual)" : ""}`,
    mes: p.mes,
    anio: p.anio,
  };
}

function fallbackCurrentPeriod() {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();
  return [
    {
      value: `${anio}-${String(mes).padStart(2, "0")}`,
      label: `${MESES[mes - 1]} ${anio} (actual)`,
      mes,
      anio,
    },
  ];
}

function ControlPagosPage() {
  const animationKey = useModuleAnimationKey();
  const [periodos, setPeriodos] = useState(fallbackCurrentPeriod);
  const [periodo, setPeriodo] = useState(currentPeriodValue);
  const [empresaId, setEmpresaId] = useState("all");
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
  const [rows, setRows] = useState<ControlPagoEmpresaApi[]>([]);
  const [cuentas, setCuentas] = useState<CuentaCobroApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const evInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const selected = useMemo(
    () => periodos.find((p) => p.value === periodo) ?? periodos[0],
    [periodo, periodos],
  );

  const empresaNombre = useCallback(
    (id: string) => empresas.find((e) => e.id === id)?.nombre ?? id.slice(0, 8),
    [empresas],
  );

  useEffect(() => {
    void listarEmpresas()
      .then(setEmpresas)
      .catch(() => setEmpresas([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getControlPagosPeriodos({
      empresa_id: empresaId !== "all" ? empresaId : undefined,
    })
      .then((data) => {
        if (cancelled) return;
        const opts = data.length > 0 ? data.map(toPeriodOption) : fallbackCurrentPeriod();
        setPeriodos(opts);
        setPeriodo((prev) =>
          opts.some((o) => o.value === prev) ? prev : (opts[0]?.value ?? currentPeriodValue()),
        );
      })
      .catch(() => {
        if (cancelled) return;
        const opts = fallbackCurrentPeriod();
        setPeriodos(opts);
        setPeriodo(opts[0]?.value ?? currentPeriodValue());
      });
    return () => {
      cancelled = true;
    };
  }, [empresaId]);

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const [control, cuentasData] = await Promise.all([
        getControlPagos({
          mes: selected.mes,
          anio: selected.anio,
          empresa_id: empresaId !== "all" ? empresaId : undefined,
        }),
        listCuentasCobro({
          periodo: selected.value,
          empresa_id: empresaId !== "all" ? empresaId : undefined,
        }),
      ]);
      setRows(control);
      setCuentas(cuentasData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el control de pagos.");
      setRows([]);
      setCuentas([]);
    } finally {
      setLoading(false);
    }
  }, [selected, empresaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.cobrar += Number(r.total_a_cobrar) || 0;
        acc.pagado += Number(r.total_pagado) || 0;
        acc.comisiones += Number(r.comisiones_generadas) || 0;
        acc.rechazadas += r.solicitudes_rechazadas;
        acc.pagadas += r.solicitudes_pagadas;
        return acc;
      },
      { cobrar: 0, pagado: 0, comisiones: 0, rechazadas: 0, pagadas: 0 },
    );
  }, [rows]);

  const cuentaPorEmpresa = useMemo(() => {
    const map = new Map<string, CuentaCobroApi>();
    for (const c of cuentas) map.set(c.empresa_id, c);
    return map;
  }, [cuentas]);

  async function runAction(key: string, fn: () => Promise<unknown>) {
    setActionKey(key);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la acción.");
    } finally {
      setActionKey(null);
    }
  }

  async function descargarReferenciaNomina(empresaId: string, empresaNombre: string) {
    if (!selected) return;
    const key = `excel:${empresaId}`;
    setActionKey(key);
    setError(null);
    try {
      const data = await getReferenciaNomina({
        empresa_id: empresaId,
        periodo: selected.value,
      });
      if (!data.detalle.length && !data.resumen.length) {
        setError(
          `No hay cuotas de nómina para ${empresaNombre} en ${selected.label}. Solo se incluyen adelantos pagados con corte en este periodo.`,
        );
        return;
      }
      exportReferenciaNominaExcel(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo generar la referencia de nómina.",
      );
    } finally {
      setActionKey(null);
    }
  }

  function onSubirCuentaCobro(row: ControlPagoEmpresaApi, file: File) {
    if (!selected) return;
    void runAction(`subir:${row.empresa_id}`, async () => {
      const cuenta = await crearCuentaCobro({
        empresa_id: row.empresa_id,
        periodo: selected.value,
      });
      await adjuntarDocumentoCobro(cuenta.id, file);
    });
  }

  function onSubirDocumentoExistente(cuentaId: string, file: File) {
    void runAction(`doc:${cuentaId}`, () => adjuntarDocumentoCobro(cuentaId, file));
  }

  function onVerificar(cuenta: CuentaCobroApi) {
    if (!window.confirm("¿Confirmar verificación de la evidencia de pago?")) return;
    void runAction(`verificar:${cuenta.id}`, () => verificarCuentaCobro(cuenta.id));
  }

  function onRechazar(cuenta: CuentaCobroApi) {
    const nota = window.prompt("Motivo del rechazo de la evidencia:");
    if (!nota?.trim()) return;
    void runAction(`rechazar:${cuenta.id}`, () => rechazarEvidenciaCobro(cuenta.id, nota.trim()));
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Operaciones"
        title="Control de pagos"
        subtitle="Resumen mensual por empresa y cuentas de cobro. Sube el PDF de la cuenta de cobro y descarga el Excel de referencia de nómina (multi-cuota) para descuentos."
      />

      {error && (
        <p className="mb-4 text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          {error}
        </p>
      )}

      <div className="admin-panel-card grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5">
        <div className="space-y-1.5">
          <Label>Periodo</Label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Seleccionar periodo" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Mes actual y meses con cuotas pendientes de cobro.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Empresa</Label>
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AdminMetricCard
          label="Total a cobrar"
          icon={Landmark}
          iconTone="trending"
          value={
            loading ? (
              "…"
            ) : (
              <AnimatedNumber
                value={totals.cobrar}
                format="currency"
                animationKey={animationKey}
                delay={0}
              />
            )
          }
          sub="cuotas del periodo"
          accent
        />
        <AdminMetricCard
          label="Total pagado"
          icon={Banknote}
          iconTone="success"
          value={
            loading ? (
              "…"
            ) : (
              <AnimatedNumber
                value={totals.pagado}
                format="currency"
                animationKey={animationKey}
                delay={80}
              />
            )
          }
          sub="adelantos desembolsados"
        />
        <AdminMetricCard
          label="Comisiones"
          icon={ListChecks}
          iconTone="wallet"
          value={
            loading ? (
              "…"
            ) : (
              <AnimatedNumber
                value={totals.comisiones}
                format="currency"
                animationKey={animationKey}
                delay={160}
              />
            )
          }
          sub="generadas en el periodo"
        />
        <AdminMetricCard
          label="Solicitudes"
          icon={Building2}
          iconTone="default"
          value={
            loading ? (
              "…"
            ) : (
              <AnimatedNumber
                value={totals.rechazadas + totals.pagadas}
                animationKey={animationKey}
                delay={240}
              />
            )
          }
          sub={`${totals.rechazadas} rech. · ${totals.pagadas} pag.`}
        />
      </section>

      <div className="admin-panel-card-flush">
        <div className="admin-card-toolbar">
          <h2 className="admin-section-title">Por empresa</h2>
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {rows.length} empresa(s)
          </span>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table min-w-[64rem]">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-left">Empresa</th>
                <th className="admin-table-th text-left hidden md:table-cell">NIT</th>
                <th className="admin-table-th text-right">Rechazadas</th>
                <th className="admin-table-th text-right">Pagadas</th>
                <th className="admin-table-th text-right">Total pagado</th>
                <th className="admin-table-th text-right">Comisiones</th>
                <th className="admin-table-th text-right">A cobrar</th>
                <th className="admin-table-th text-left">Cuenta</th>
                <th className="admin-table-th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const cuenta =
                  cuentaPorEmpresa.get(row.empresa_id) ??
                  (row.cuenta_cobro_id
                    ? ({
                        id: row.cuenta_cobro_id,
                        empresa_id: row.empresa_id,
                        estado: (row.cuenta_cobro_estado ?? "borrador") as EstadoCuentaCobroApi,
                      } as CuentaCobroApi)
                    : undefined);
                const busy = actionKey?.endsWith(row.empresa_id) || actionKey?.endsWith(cuenta?.id ?? "");
                return (
                  <tr key={row.empresa_id} className="hover:bg-muted/30">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="admin-table-icon-wrap">
                          <Building2 className="admin-table-icon" />
                        </div>
                        <div className="admin-table-cell-title">{row.empresa_nombre}</div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell tabular admin-table-cell-mono">
                      {row.empresa_nit}
                    </td>
                    <td className="text-right tabular">{row.solicitudes_rechazadas}</td>
                    <td className="text-right tabular">{row.solicitudes_pagadas}</td>
                    <td className="text-right admin-table-cell-money tabular">
                      {formatCOP(Number(row.total_pagado) || 0)}
                    </td>
                    <td className="text-right admin-table-cell-money tabular">
                      {formatCOP(Number(row.comisiones_generadas) || 0)}
                    </td>
                    <td className="text-right admin-table-cell-money tabular font-semibold text-primary">
                      {formatCOP(Number(row.total_a_cobrar) || 0)}
                    </td>
                    <td>
                      {cuenta ? (
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_CUENTA_COBRO_CLASSES[cuenta.estado]}`}
                        >
                          {estadoCuentaCobroLabel[cuenta.estado]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin cuenta</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!busy}
                          className="border-emerald-200/80 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900"
                          title="Descargar Excel de descuentos de nómina del periodo"
                          onClick={() =>
                            void descargarReferenciaNomina(row.empresa_id, row.empresa_nombre)
                          }
                        >
                          {actionKey === `excel:${row.empresa_id}` ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <>
                              <FileSpreadsheet className="size-3.5 sm:mr-1.5" />
                              <span className="hidden sm:inline">Excel nómina</span>
                            </>
                          )}
                        </Button>
                        {!cuenta && Number(row.total_a_cobrar) > 0 && (
                          <>
                            <input
                              ref={(el) => {
                                docInputRefs.current[`new:${row.empresa_id}`] = el;
                              }}
                              type="file"
                              className="hidden"
                              accept="application/pdf,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                void onSubirCuentaCobro(row, file);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!!busy}
                              title="Subir PDF de la cuenta de cobro"
                              onClick={() =>
                                docInputRefs.current[`new:${row.empresa_id}`]?.click()
                              }
                            >
                              {actionKey === `subir:${row.empresa_id}` ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <>
                                  <FileUp className="size-3.5 sm:mr-1.5" />
                                  <span className="hidden sm:inline">Subir cuenta de cobro</span>
                                  <span className="sm:hidden">Subir PDF</span>
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        {cuenta?.estado === "borrador" && (
                          <>
                            <input
                              ref={(el) => {
                                docInputRefs.current[cuenta.id] = el;
                              }}
                              type="file"
                              className="hidden"
                              accept="application/pdf,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                onSubirDocumentoExistente(cuenta.id, file);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!!busy}
                              title="Subir PDF de la cuenta de cobro"
                              onClick={() => docInputRefs.current[cuenta.id]?.click()}
                            >
                              {actionKey === `doc:${cuenta.id}` ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <>
                                  <FileUp className="size-3.5 sm:mr-1.5" />
                                  <span className="hidden sm:inline">Subir cuenta de cobro</span>
                                  <span className="sm:hidden">Subir PDF</span>
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        {cuenta &&
                          (cuenta.estado === "emitida" || cuenta.estado === "rechazada") && (
                            <>
                              <input
                                ref={(el) => {
                                  evInputRefs.current[cuenta.id] = el;
                                }}
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (!file) return;
                                  void runAction(`ev:${cuenta.id}`, () =>
                                    registrarEvidenciaCobro(cuenta.id, file),
                                  );
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!!busy}
                                title="Subir el PDF de la cuenta de cobro para que la empresa pague"
                                onClick={() => evInputRefs.current[cuenta.id]?.click()}
                              >
                                <FileUp className="size-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Subir cuenta de cobro</span>
                                <span className="sm:hidden">Subir cuenta</span>
                              </Button>
                            </>
                          )}
                        {cuenta?.estado === "evidencia_enviada" && (
                          <>
                            <Button
                              size="sm"
                              disabled={!!busy}
                              onClick={() => onVerificar(cuenta)}
                            >
                              Verificar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!!busy}
                              onClick={() => onRechazar(cuenta)}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="admin-table-empty">
                    No hay datos de control de pagos para este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {cuentas.length > 0 && (
        <div className="admin-panel-card-flush mt-4">
          <div className="admin-card-toolbar">
            <h2 className="admin-section-title">Cuentas de cobro del periodo</h2>
            <span className="text-sm text-muted-foreground">{cuentas.length} cuenta(s)</span>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table min-w-[48rem]">
              <thead className="admin-table-head">
                <tr>
                  <th className="admin-table-th text-left">Empresa</th>
                  <th className="admin-table-th text-right">Adelantos</th>
                  <th className="admin-table-th text-right">Total cobrar</th>
                  <th className="admin-table-th text-left">Estado</th>
                  <th className="admin-table-th text-left">Adjuntos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cuentas.map((c) => (
                  <tr key={c.id}>
                    <td className="admin-table-cell-title">{empresaNombre(c.empresa_id)}</td>
                    <td className="text-right tabular">{c.adelanto_ids.length}</td>
                    <td className="text-right tabular font-medium">
                      {formatCOP(Number(c.monto_total_cobrar) || 0)}
                    </td>
                    <td>
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_CUENTA_COBRO_CLASSES[c.estado]}`}
                      >
                        {estadoCuentaCobroLabel[c.estado]}
                      </span>
                      {c.nota_revision && (
                        <p className="mt-1 text-xs text-muted-foreground">{c.nota_revision}</p>
                      )}
                    </td>
                    <td className="text-sm">
                      <div className="flex flex-col gap-1">
                        {c.documento_cobro_url ? (
                          <a
                            href={c.documento_cobro_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            Documento
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Sin documento</span>
                        )}
                        {c.evidencia_pago_url ? (
                          <a
                            href={c.evidencia_pago_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            Cuenta de cobro
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Sin cuenta de cobro</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
