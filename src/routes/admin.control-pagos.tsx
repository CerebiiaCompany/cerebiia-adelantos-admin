import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCOP } from "@/lib/admin-store";
import {
  adjuntarDocumentoCobro,
  crearCuentaCobro,
  getControlPagos,
  listCuentasCobro,
  rechazarEvidenciaCobro,
  registrarEvidenciaCobro,
  verificarCuentaCobro,
} from "@/lib/api/admin";
import { listarEmpresas } from "@/lib/api/empresas";
import { ApiError } from "@/lib/api/errors";
import type {
  ControlPagoEmpresaApi,
  CuentaCobroApi,
  EmpresaListItem,
  EstadoCuentaCobroApi,
} from "@/lib/api/types";
import { estadoCuentaCobroLabel, ESTADO_CUENTA_COBRO_CLASSES } from "@/lib/cuenta-cobro";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Landmark, Loader2, Banknote, ListChecks, FileUp } from "lucide-react";

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

function periodOptions(yearsBack = 2) {
  const now = new Date();
  const options: { value: string; label: string; mes: number; anio: number }[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - yearsBack; y--) {
    const maxMes = y === now.getFullYear() ? now.getMonth() + 1 : 12;
    for (let m = maxMes; m >= 1; m--) {
      options.push({
        value: `${y}-${String(m).padStart(2, "0")}`,
        label: `${MESES[m - 1]} ${y}`,
        mes: m,
        anio: y,
      });
    }
  }
  return options;
}

function ControlPagosPage() {
  const periodos = useMemo(() => periodOptions(), []);
  const [periodo, setPeriodo] = useState(periodos[0]?.value ?? "");
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
        acc.pendientes += r.solicitudes_pendientes;
        acc.aprobadas += r.solicitudes_aprobadas;
        return acc;
      },
      { cobrar: 0, pagado: 0, comisiones: 0, pendientes: 0, aprobadas: 0 },
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

  function onCrear(row: ControlPagoEmpresaApi) {
    if (!selected) return;
    void runAction(`crear:${row.empresa_id}`, () =>
      crearCuentaCobro({
        empresa_id: row.empresa_id,
        periodo: selected.value,
      }),
    );
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
        subtitle="Resumen mensual por empresa y flujo de cuentas de cobro: documento, evidencia, verificación o rechazo."
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          value={loading ? "…" : formatCOP(totals.cobrar)}
          sub={selected?.label}
          accent
        />
        <AdminMetricCard
          label="Total pagado"
          icon={Banknote}
          iconTone="success"
          value={loading ? "…" : formatCOP(totals.pagado)}
          sub="adelantos desembolsados"
        />
        <AdminMetricCard
          label="Comisiones"
          icon={ListChecks}
          iconTone="wallet"
          value={loading ? "…" : formatCOP(totals.comisiones)}
          sub="generadas en el periodo"
        />
        <AdminMetricCard
          label="Solicitudes"
          icon={Building2}
          iconTone="default"
          value={loading ? "…" : String(totals.pendientes + totals.aprobadas)}
          sub={`${totals.pendientes} pend. · ${totals.aprobadas} aprob.`}
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
                <th className="admin-table-th text-right">Pendientes</th>
                <th className="admin-table-th text-right">Aprobadas</th>
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
                    <td className="text-right tabular">{row.solicitudes_pendientes}</td>
                    <td className="text-right tabular">{row.solicitudes_aprobadas}</td>
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
                        {!cuenta && Number(row.total_pagado) > 0 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!!busy}
                            onClick={() => onCrear(row)}
                          >
                            {actionKey === `crear:${row.empresa_id}` ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Crear cuenta"
                            )}
                          </Button>
                        )}
                        {cuenta?.estado === "borrador" && (
                          <>
                            <input
                              ref={(el) => {
                                docInputRefs.current[cuenta.id] = el;
                              }}
                              type="file"
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg,.webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (!file) return;
                                void runAction(`doc:${cuenta.id}`, () =>
                                  adjuntarDocumentoCobro(cuenta.id, file),
                                );
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!busy}
                              onClick={() => docInputRefs.current[cuenta.id]?.click()}
                            >
                              <FileUp className="size-3.5" />
                              Documento
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
                                onClick={() => evInputRefs.current[cuenta.id]?.click()}
                              >
                                <FileUp className="size-3.5" />
                                Evidencia
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
                            Evidencia
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Sin evidencia</span>
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
