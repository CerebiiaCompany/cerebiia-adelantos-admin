import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCOP, estadoLabel, type EstadoAdelanto } from "@/lib/admin-store";
import { ESTADO_BADGE_CLASSES, cuotaCountBadgeClass } from "@/lib/adelanto-estado";
import { getHistorialAdelantosAdmin } from "@/lib/api/admin";
import { listarEmpresas } from "@/lib/api/empresas";
import { ApiError } from "@/lib/api/errors";
import type {
  EmpresaListItem,
  HistorialAdelantosAdminResponse,
  EstadoSolicitudApi,
  SolicitudHistorialAdminItem,
} from "@/lib/api/types";
import { DEFAULT_MAX_CUOTAS } from "@/lib/adelanto-calculo";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdelantosStat } from "@/components/admin/adelantos-filters-panel";
import { useAdelantoParametros } from "@/hooks/use-adelanto-parametros";
import { useModuleAnimationKey } from "@/hooks/use-module-animation-key";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/admin/historial-adelantos")({
  head: () => ({ meta: [{ title: "Historial de adelantos — Panel" }] }),
  component: HistorialAdelantosPage,
});

const ESTADOS: EstadoSolicitudApi[] = [
  "solicitado",
  "en_revision",
  "aprobado",
  "rechazado",
  "pagado",
];

function HistorialAdelantosPage() {
  const animationKey = useModuleAnimationKey();
  const { numeroMaximoCuotas } = useAdelantoParametros();
  const [empresas, setEmpresas] = useState<EmpresaListItem[]>([]);
  const [empresaId, setEmpresaId] = useState("all");
  const [estado, setEstado] = useState<EstadoSolicitudApi | "all">("all");
  const [cuotas, setCuotas] = useState<"all" | string>("all");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistorialAdelantosAdminResponse | null>(null);

  const maxCuotas = Math.max(DEFAULT_MAX_CUOTAS, numeroMaximoCuotas || DEFAULT_MAX_CUOTAS);
  const opcionesCuotas = useMemo(
    () => Array.from({ length: maxCuotas }, (_, i) => i + 1),
    [maxCuotas],
  );

  useEffect(() => {
    void listarEmpresas()
      .then(setEmpresas)
      .catch(() => setEmpresas([]));
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = busquedaInput.trim();
      setBusqueda((prev) => {
        if (prev === next) return prev;
        setPage(1);
        return next;
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [busquedaInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const numeroCuotas =
        cuotas !== "all" && Number.isFinite(Number(cuotas)) ? Number(cuotas) : undefined;
      const res = await getHistorialAdelantosAdmin({
        empresa_id: empresaId !== "all" ? empresaId : undefined,
        estado: estado !== "all" ? estado : undefined,
        fecha_desde: fechaDesde ? `${fechaDesde}T00:00:00` : undefined,
        fecha_hasta: fechaHasta ? `${fechaHasta}T23:59:59` : undefined,
        busqueda: busqueda || undefined,
        numero_cuotas: numeroCuotas,
        page,
        page_size: 20,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el historial.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [empresaId, estado, cuotas, fechaDesde, fechaHasta, busqueda, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.count / Math.max(data.page_size, 1)));
  }, [data]);

  const clearFilters = () => {
    setEmpresaId("all");
    setEstado("all");
    setCuotas("all");
    setFechaDesde("");
    setFechaHasta("");
    setBusquedaInput("");
    setBusqueda("");
    setPage(1);
  };

  const inds = data?.indicadores;

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Operaciones"
        title="Historial de adelantos"
        subtitle="Historial global con indicadores consolidados del servidor."
      />

      {error && (
        <p className="mb-4 text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
          <Loader2 className="size-4 animate-spin" />
          Cargando historial…
        </p>
      )}

      <div className="admin-panel-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4 p-4 sm:p-5">
        <div className="space-y-1.5 sm:col-span-2 xl:col-span-2">
          <Label htmlFor="hist-busqueda">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="hist-busqueda"
              className="pl-9"
              placeholder="Nombre o documento del empleado…"
              value={busquedaInput}
              onChange={(e) => setBusquedaInput(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Empresa</Label>
          <Select
            value={empresaId}
            onValueChange={(v) => {
              setEmpresaId(v);
              setPage(1);
            }}
          >
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
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select
            value={estado}
            onValueChange={(v) => {
              setEstado(v as EstadoSolicitudApi | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>
                  {estadoLabel[e as EstadoAdelanto]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Cuotas</Label>
          <Select
            value={cuotas}
            onValueChange={(v) => {
              setCuotas(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {opcionesCuotas.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === 1 ? "1 cuota" : `${n} cuotas`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist-desde">Desde</Label>
          <Input
            id="hist-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hist-hasta">Hasta</Label>
          <Input
            id="hist-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-end sm:col-span-2 xl:col-span-7">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full sm:w-auto"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <AdelantosStat
          label="Total solicitudes"
          value={inds?.total_solicitudes ?? 0}
          animationKey={animationKey}
          delay={0}
          loading={loading && !inds}
        />
        <AdelantosStat
          label="Pendientes"
          value={inds?.pendientes ?? 0}
          animationKey={animationKey}
          delay={60}
          loading={loading && !inds}
        />
        <AdelantosStat
          label="Rechazadas"
          value={inds?.rechazadas ?? 0}
          animationKey={animationKey}
          delay={120}
          loading={loading && !inds}
        />
        <AdelantosStat
          label="Pagadas"
          value={inds?.pagadas ?? 0}
          animationKey={animationKey}
          delay={180}
          loading={loading && !inds}
        />
        <AdelantosStat
          label="Monto procesado"
          value={Number(inds?.monto_total_procesado) || 0}
          format="currency"
          animationKey={animationKey}
          delay={240}
          loading={loading && !inds}
        />
      </div>

      <div className="admin-panel-card-flush">
        <div className="admin-card-toolbar">
          <h2 className="admin-section-title">Solicitudes</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground tabular">
              {page} / {totalPages} · {data?.count ?? 0} reg.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>

        <div className="admin-table-scroll">
          <table className="admin-table min-w-[56rem]">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th text-left">Empleado</th>
                <th className="admin-table-th text-left hidden md:table-cell">Empresa</th>
                <th className="admin-table-th text-left hidden lg:table-cell">Fecha</th>
                <th className="admin-table-th text-right">Monto</th>
                <th className="admin-table-th text-right">Neto</th>
                <th className="admin-table-th text-center">Cuotas</th>
                <th className="admin-table-th text-center">Estado</th>
                <th className="admin-table-th text-left hidden xl:table-cell">Decidido por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.results ?? []).map((row) => (
                <HistorialRow key={row.id} row={row} />
              ))}
              {!loading && (data?.results.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    No hay solicitudes en el historial con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HistorialRow({ row }: { row: SolicitudHistorialAdminItem }) {
  return (
    <tr className="hover:bg-muted/30">
      <td>
        <div className="admin-table-cell-title">{row.empleado_nombre}</div>
        <div className="admin-table-cell-note tabular">CC {row.empleado_documento}</div>
        <div className="admin-table-cell-note md:hidden mt-0.5">{row.empresa_nombre}</div>
      </td>
      <td className="hidden md:table-cell text-muted-foreground">{row.empresa_nombre}</td>
      <td className="hidden lg:table-cell text-muted-foreground tabular">
        {row.created_at
          ? new Date(row.created_at).toLocaleDateString("es-CO")
          : "—"}
      </td>
      <td className="text-right admin-table-cell-money tabular">
        {formatCOP(Number(row.monto) || 0)}
      </td>
      <td className="text-right admin-table-cell-money tabular text-primary font-semibold">
        {formatCOP(Number(row.monto_neto) || 0)}
      </td>
      <td className="text-center">
        <span
          className={`inline-flex min-w-8 items-center justify-center rounded-md px-2 py-1 text-sm font-semibold tabular ${cuotaCountBadgeClass(row.numero_cuotas_snapshot)}`}
        >
          {row.numero_cuotas_snapshot}
        </span>
      </td>
      <td className="text-center">
        <span
          className={`inline-flex items-center text-sm font-medium rounded-md border px-2.5 py-1 ${ESTADO_BADGE_CLASSES[row.estado as EstadoAdelanto] ?? ""}`}
        >
          {estadoLabel[row.estado as EstadoAdelanto] ?? row.estado}
        </span>
      </td>
      <td className="hidden xl:table-cell text-sm text-muted-foreground">
        {row.decidido_por_nombre ?? "—"}
      </td>
    </tr>
  );
}
