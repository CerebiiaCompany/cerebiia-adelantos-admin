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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building2,
  Landmark,
  Loader2,
  Banknote,
  ListChecks,
  FileUp,
  FileSpreadsheet,
  Search,
  X,
  Coins,
  CheckCircle2,
  Check,
  FileText,
  Eye,
} from "lucide-react";
import { LiberarPagosDialog } from "@/components/admin/liberar-pagos-dialog";
import { InformeCuotasLiberadasDialog } from "@/components/admin/informe-cuotas-liberadas-dialog";
import { DetalleAdelantosCobroDialog } from "@/components/admin/detalle-adelantos-cobro-dialog";
import type { LiberarCuotasResponse } from "@/lib/api/types";

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
  const [busquedaEmpresa, setBusquedaEmpresa] = useState("");
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
  const [rows, setRows] = useState<ControlPagoEmpresaApi[]>([]);
  const [cuentas, setCuentas] = useState<CuentaCobroApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liberarModalEmpresa, setLiberarModalEmpresa] = useState<ControlPagoEmpresaApi | null>(null);
  const [liberarModalOpen, setLiberarModalOpen] = useState(false);
  const [detalleModalEmpresa, setDetalleModalEmpresa] = useState<ControlPagoEmpresaApi | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [informeModalOpen, setInformeModalOpen] = useState(false);
  const [informeData, setInformeData] = useState<LiberarCuotasResponse | null>(null);
  const [informeEmpresa, setInformeEmpresa] = useState<ControlPagoEmpresaApi | null>(null);
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

  const empresasFiltradas = useMemo(() => {
    const q = busquedaEmpresa.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        (e.nit && e.nit.toLowerCase().includes(q)),
    );
  }, [empresas, busquedaEmpresa]);

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

  const cuentaPorEmpresa = useMemo(() => {
    const map = new Map<string, CuentaCobroApi>();
    for (const c of cuentas) map.set(c.empresa_id, c);
    return map;
  }, [cuentas]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const cuenta = cuentaPorEmpresa.get(r.empresa_id);
        const isVerificada =
          cuenta?.estado === "verificada" || r.cuenta_cobro_estado === "verificada";
        acc.cobrar += isVerificada ? 0 : (Number(r.total_a_cobrar) || 0);
        acc.pagado += Number(r.total_pagado) || 0;
        acc.comisiones += Number(r.comisiones_generadas) || 0;
        acc.rechazadas += r.solicitudes_rechazadas;
        acc.pagadas += r.solicitudes_pagadas;
        return acc;
      },
      { cobrar: 0, pagado: 0, comisiones: 0, rechazadas: 0, pagadas: 0 },
    );
  }, [rows, cuentaPorEmpresa]);

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
          <div className="flex items-center justify-between">
            <Label>Empresa</Label>
            {busquedaEmpresa.trim() && (
              <span className="text-[11px] font-medium text-primary">
                {empresasFiltradas.length} encontrada{empresasFiltradas.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={busquedaEmpresa}
                onChange={(e) => setBusquedaEmpresa(e.target.value)}
                placeholder="Filtrar por iniciales..."
                className="h-10 pl-9 pr-8 text-xs rounded-xl border-border/80 focus-visible:ring-primary/20"
              />
              {busquedaEmpresa && (
                <button
                  type="button"
                  onClick={() => setBusquedaEmpresa("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">Todas las empresas</SelectItem>
                {empresasFiltradas.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Sin coincidencias para "{busquedaEmpresa}"
                  </div>
                ) : (
                  empresasFiltradas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Escribe las iniciales para filtrar el selector de empresas.
          </p>
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
                const isVerificada =
                  cuenta?.estado === "verificada" || row.cuenta_cobro_estado === "verificada";
                const totalCobrar = Number(row.total_a_cobrar) || 0;
                const estaAlDia =
                  isVerificada ||
                  (totalCobrar === 0 &&
                    (row.solicitudes_pagadas > 0 || row.cuenta_cobro_estado === "verificada"));

                return (
                  <tr key={row.empresa_id} className="hover:bg-muted/30">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="admin-table-icon-wrap shrink-0">
                          <Building2 className="admin-table-icon" />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="admin-table-cell-title font-medium">{row.empresa_nombre}</span>
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7 rounded-lg text-muted-foreground/80 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-colors shrink-0 cursor-pointer"
                                  onClick={() => {
                                    setDetalleModalEmpresa(row);
                                    setDetalleModalOpen(true);
                                  }}
                                  aria-label="Ver detalles"
                                >
                                  <Eye className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-medium">
                                Ver detalles
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
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
                    <td className="text-right admin-table-cell-money tabular font-semibold">
                      {estaAlDia ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCOP(0)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/50 mt-0.5 shadow-xs">
                            <CheckCircle2 className="size-2.5 text-emerald-600" /> A paz y salvo
                          </span>
                        </div>
                      ) : totalCobrar === 0 ? (
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatCOP(0)}
                        </span>
                      ) : (
                        <span className="text-primary font-bold">
                          {formatCOP(totalCobrar)}
                        </span>
                      )}
                    </td>
                    <td>
                      {cuenta ? (
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${ESTADO_CUENTA_COBRO_CLASSES[cuenta.estado]}`}
                        >
                          {estadoCuentaCobroLabel[cuenta.estado]}
                        </span>
                      ) : estaAlDia ? (
                        <span className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                          Al día
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin cuenta</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end items-center gap-1.5">
                        {estaAlDia ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 shadow-xs">
                              <CheckCircle2 className="size-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">A paz y salvo</span>
                            </span>
                            {informeData && informeEmpresa?.empresa_id === row.empresa_id && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="size-8 text-primary border-primary/30 hover:bg-primary/10 rounded-lg shadow-xs cursor-pointer"
                                    onClick={() => {
                                      setInformeModalOpen(true);
                                    }}
                                    aria-label="Ver informe de pagos liberados"
                                  >
                                    <FileText className="size-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs font-medium">
                                  Ver informe de pagos liberados
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        ) : totalCobrar > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                disabled={!!busy}
                                className="size-8 rounded-lg border-emerald-300/90 dark:border-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 shadow-xs cursor-pointer"
                                onClick={() => {
                                  setLiberarModalEmpresa(row);
                                  setLiberarModalOpen(true);
                                }}
                                aria-label="Liberar pagos"
                              >
                                <Coins className="size-4 text-emerald-600 dark:text-emerald-400" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-medium">
                              Liberar pagos de cuotas y restaurar saldo
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={!!busy}
                              className="size-8 rounded-lg border-blue-200/80 bg-blue-50/60 text-blue-800 hover:bg-blue-100 hover:text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs cursor-pointer"
                              onClick={() =>
                                void descargarReferenciaNomina(row.empresa_id, row.empresa_nombre)
                              }
                              aria-label="Descargar Excel de nómina"
                            >
                              {actionKey === `excel:${row.empresa_id}` ? (
                                <Loader2 className="size-4 animate-spin text-blue-600" />
                              ) : (
                                <FileSpreadsheet className="size-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-medium">
                            Descargar Excel de descuentos de nómina
                          </TooltipContent>
                        </Tooltip>
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  disabled={!!busy}
                                  className="size-8 rounded-lg shadow-xs cursor-pointer"
                                  onClick={() =>
                                    docInputRefs.current[`new:${row.empresa_id}`]?.click()
                                  }
                                  aria-label="Subir cuenta de cobro"
                                >
                                  {actionKey === `subir:${row.empresa_id}` ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <FileUp className="size-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-medium">
                                Subir PDF de cuenta de cobro
                              </TooltipContent>
                            </Tooltip>
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  disabled={!!busy}
                                  className="size-8 rounded-lg shadow-xs cursor-pointer"
                                  onClick={() => docInputRefs.current[cuenta.id]?.click()}
                                  aria-label="Subir cuenta de cobro"
                                >
                                  {actionKey === `doc:${cuenta.id}` ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <FileUp className="size-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-medium">
                                Subir PDF de cuenta de cobro
                              </TooltipContent>
                            </Tooltip>
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={!!busy}
                                    className="size-8 rounded-lg border-amber-300/80 bg-amber-50/60 text-amber-800 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 shadow-xs cursor-pointer"
                                    onClick={() => evInputRefs.current[cuenta.id]?.click()}
                                    aria-label="Subir cuenta de cobro para pago"
                                  >
                                    <FileUp className="size-4 text-amber-700 dark:text-amber-400" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs font-medium">
                                  Subir PDF de cuenta de cobro para pago
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        {cuenta?.estado === "evidencia_enviada" && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  disabled={!!busy}
                                  className="size-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                                  onClick={() => onVerificar(cuenta)}
                                  aria-label="Verificar cuenta de cobro"
                                >
                                  <Check className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-medium">
                                Verificar cuenta de cobro
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  disabled={!!busy}
                                  className="size-8 rounded-lg shadow-xs cursor-pointer"
                                  onClick={() => onRechazar(cuenta)}
                                  aria-label="Rechazar evidencia"
                                >
                                  <X className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-medium">
                                Rechazar evidencia
                              </TooltipContent>
                            </Tooltip>
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

      <LiberarPagosDialog
        open={liberarModalOpen}
        onOpenChange={setLiberarModalOpen}
        empresa={liberarModalEmpresa}
        periodo={periodo}
        periodoLabel={selected?.label}
        onSuccess={(res) => {
          if (liberarModalEmpresa) {
            setInformeEmpresa(liberarModalEmpresa);
          }
          setInformeData(res);
          setInformeModalOpen(true);
          void load();
        }}
      />

      <InformeCuotasLiberadasDialog
        open={informeModalOpen}
        onOpenChange={setInformeModalOpen}
        informe={informeData}
        empresaNombre={informeEmpresa?.empresa_nombre}
        empresaNit={informeEmpresa?.empresa_nit}
        periodoLabel={selected?.label}
      />

      <DetalleAdelantosCobroDialog
        open={detalleModalOpen}
        onOpenChange={setDetalleModalOpen}
        empresa={detalleModalEmpresa}
        periodo={periodo}
        periodoLabel={selected?.label}
      />
    </div>
  );
}
