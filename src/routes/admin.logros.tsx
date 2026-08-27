import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createLogro,
  deleteLogro,
  listLogros,
  updateLogro,
  type CrearLogroPayload,
  type LogroAdmin,
} from "@/lib/api/logros";
import { ApiError } from "@/lib/api/errors";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { useModuleAnimationKey } from "@/hooks/use-module-animation-key";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LogroBadgeIcon,
  IconColorPickerModal,
  IconPickerButton,
} from "@/components/admin/icon-color-picker";
import {
  parseIconKey,
  buildIconKey,
  DEFAULT_LOGRO_COLOR,
  DEFAULT_LOGRO_ICON,
} from "@/components/admin/logro-icon-helper";
import {
  Trophy,
  Plus,
  Save,
  Trash2,
  Edit2,
  Sparkles,
  Award,
  Zap,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Coins,
  ArrowUpDown,
  SlidersHorizontal,
  Flame,
  Wand2,
  HelpCircle,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/logros")({
  head: () => ({ meta: [{ title: "Logros e Insignias — Panel Super Admin" }] }),
  component: LogrosAdminPage,
});

export const PREDEFINED_SLUGS = [
  { value: "primer_paso", label: "primer_paso (1er adelanto exitoso)" },
  { value: "primer_adelanto", label: "primer_adelanto (Primer adelanto)" },
  { value: "finanzas_al_dia", label: "finanzas_al_dia (3 adelantos)" },
  { value: "planificador_estrella", label: "planificador_estrella (5 adelantos)" },
  { value: "maestro_ahorro", label: "maestro_ahorro (10 adelantos)" },
  { value: "imparable", label: "imparable (15 adelantos)" },
  { value: "leyenda_financiera", label: "leyenda_financiera (20 adelantos)" },
  { value: "adelanto_3", label: "adelanto_3 (Meta 3 adelantos)" },
  { value: "adelanto_5", label: "adelanto_5 (Meta 5 adelantos)" },
  { value: "adelanto_10", label: "adelanto_10 (Meta 10 adelantos)" },
  { value: "adelanto_15", label: "adelanto_15 (Meta 15 adelantos)" },
  { value: "adelanto_20", label: "adelanto_20 (Meta 20 adelantos)" },
  { value: "puntualidad_oro", label: "puntualidad_oro (Cumplimiento de pagos)" },
  { value: "escudo_confianza", label: "escudo_confianza (Verificación segura)" },
  { value: "empleado_destacado", label: "empleado_destacado (Mención especial)" },
  { value: "gran_campeon", label: "gran_campeon (Premio administración)" },
  { value: "ahorro_constante", label: "ahorro_constante (Constancia financiera)" },
  { value: "fidelidad_cerebiia", label: "fidelidad_cerebiia (Fidelidad de usuario)" },
  { value: "usuario_verificado", label: "usuario_verificado (Validación completada)" },
  { value: "custom", label: "✏️ Escribir código personalizado..." },
];

const defaultForm: CrearLogroPayload & {
  color: string;
  iconName: string;
  isCustomSlug?: boolean;
} = {
  codigo: "primer_paso",
  titulo: "",
  descripcion: "",
  puntos: 100,
  icon_key: "trophy:#9333EA",
  iconName: DEFAULT_LOGRO_ICON,
  color: DEFAULT_LOGRO_COLOR,
  regla: "manual",
  umbral: 1,
  activo: true,
  orden: 0,
  isCustomSlug: false,
};

export const DEFAULT_STARTER_LOGROS: Array<CrearLogroPayload> = [
  {
    codigo: "primer_paso",
    titulo: "Primer Paso",
    descripcion: "¡Bienvenido a Cerebiia! Solicitaste tu primer adelanto de nómina exitosamente.",
    puntos: 100,
    icon_key: "rocket",
    regla: "primera_vez",
    umbral: null,
    activo: true,
    orden: 1,
  },
  {
    codigo: "finanzas_al_dia",
    titulo: "Finanzas al Día",
    descripcion: "Alcanzaste 3 adelantos solicitados con responsabilidad y puntualidad.",
    puntos: 150,
    icon_key: "wallet",
    regla: "adelanto_count",
    umbral: 3,
    activo: true,
    orden: 2,
  },
  {
    codigo: "planificador_estrella",
    titulo: "Planificador Estrella",
    descripcion: "Completaste 5 adelantos gestionados sin contratiempos.",
    puntos: 250,
    icon_key: "star",
    regla: "adelanto_count",
    umbral: 5,
    activo: true,
    orden: 3,
  },
  {
    codigo: "maestro_ahorro",
    titulo: "Maestro del Ahorro",
    descripcion: "Has demostrado una excelente gestión de liquidez con 10 adelantos completados.",
    puntos: 500,
    icon_key: "coins",
    regla: "adelanto_count",
    umbral: 10,
    activo: true,
    orden: 4,
  },
  {
    codigo: "imparable",
    titulo: "Imparable",
    descripcion: "Gran trayectoria y fidelidad con 15 adelantos en la plataforma.",
    puntos: 750,
    icon_key: "flame",
    regla: "adelanto_count",
    umbral: 15,
    activo: true,
    orden: 5,
  },
  {
    codigo: "leyenda_financiera",
    titulo: "Leyenda Financiera",
    descripcion: "Máximo nivel de confianza y experiencia alcanzando 20 adelantos.",
    puntos: 1000,
    icon_key: "crown",
    regla: "adelanto_count",
    umbral: 20,
    activo: true,
    orden: 6,
  },
  {
    codigo: "puntualidad_oro",
    titulo: "Puntualidad de Oro",
    descripcion: "Reconocimiento por impecable cumplimiento en todos tus pagos de cuotas.",
    puntos: 200,
    icon_key: "clock",
    regla: "manual",
    umbral: null,
    activo: true,
    orden: 7,
  },
  {
    codigo: "escudo_confianza",
    titulo: "Escudo de Confianza",
    descripcion: "Perfil verificado y validado con los más altos estándares de seguridad.",
    puntos: 150,
    icon_key: "shield",
    regla: "manual",
    umbral: null,
    activo: true,
    orden: 8,
  },
  {
    codigo: "empleado_destacado",
    titulo: "Empleado Destacado",
    descripcion: "Mención especial otorgada por tu empresa por compromiso y excelencia.",
    puntos: 300,
    icon_key: "medal",
    regla: "manual",
    umbral: null,
    activo: true,
    orden: 9,
  },
  {
    codigo: "gran_campeon",
    titulo: "Gran Campeón",
    descripcion: "Premio especial otorgado por el equipo de administración de Cerebiia.",
    puntos: 500,
    icon_key: "trophy",
    regla: "manual",
    umbral: null,
    activo: true,
    orden: 10,
  },
];

function reglaLabel(regla: string, umbral?: number | null): { label: string; subtext: string } {
  switch (regla) {
    case "primera_vez":
      return {
        label: "Primer adelanto",
        subtext: "Automático al completar el 1er adelanto",
      };
    case "adelanto_count":
      return {
        label: `Meta ${umbral ?? 1} adelantos`,
        subtext: `Automático al acumular ${umbral ?? 1} adelantos`,
      };
    case "manual":
    default:
      return {
        label: "Manual",
        subtext: "Otorgado manualmente por administración",
      };
  }
}

function LogrosAdminPage() {
  const animationKey = useModuleAnimationKey();
  const [items, setItems] = useState<LogroAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingDefaults, setGeneratingDefaults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [filtroRegla, setFiltroRegla] = useState<string>("all");
  const [mobileFiltrosOpen, setMobileFiltrosOpen] = useState(false);

  // Modal de Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  // Modal de Selector de Icono / Color
  const [pickerOpen, setPickerOpen] = useState(false);

  // Modal explicativo / Guía para crear insignias
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Diálogo de confirmación de eliminación
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listLogros();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo cargar el catálogo de logros e insignias.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      ...defaultForm,
      codigo: "primer_paso",
      titulo: "",
      descripcion: "",
      puntos: 100,
      iconName: DEFAULT_LOGRO_ICON,
      color: DEFAULT_LOGRO_COLOR,
      icon_key: buildIconKey(DEFAULT_LOGRO_ICON, DEFAULT_LOGRO_COLOR),
      regla: "manual",
      umbral: 1,
      activo: true,
      orden: items.length + 1,
      isCustomSlug: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (logro: LogroAdmin) => {
    setEditingId(logro.id);
    const { iconName, color } = parseIconKey(logro.icon_key);
    const isPreset = PREDEFINED_SLUGS.some((s) => s.value === logro.codigo);
    setFormData({
      codigo: logro.codigo,
      titulo: logro.titulo,
      descripcion: logro.descripcion,
      puntos: logro.puntos,
      icon_key: logro.icon_key,
      iconName,
      color,
      regla: (logro.regla as CrearLogroPayload["regla"]) || "manual",
      umbral: logro.umbral ?? 1,
      activo: logro.activo,
      orden: logro.orden,
      isCustomSlug: !isPreset,
    });
    setModalOpen(true);
  };

  const handleIconColorSelected = (iconName: string, color: string) => {
    const icon_key = buildIconKey(iconName, color);
    setFormData((f) => ({
      ...f,
      iconName,
      color,
      icon_key,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || (!editingId && !formData.codigo.trim())) {
      setError("Por favor completa el título y el código del logro.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const icon_key = buildIconKey(formData.iconName, formData.color);
    const finalPuntos = Math.max(0, Math.round(Number(formData.puntos) || 0));
    const finalOrden = Math.max(0, Math.round(Number(formData.orden) || 0));
    const finalUmbral =
      formData.regla === "adelanto_count"
        ? Math.max(1, Math.round(Number(formData.umbral) || 1))
        : null;

    try {
      if (editingId) {
        await updateLogro(editingId, {
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion.trim(),
          puntos: finalPuntos,
          icon_key,
          regla: formData.regla,
          umbral: finalUmbral,
          activo: Boolean(formData.activo),
          orden: finalOrden,
        });
        setSuccess("Insignia actualizada correctamente.");
      } else {
        await createLogro({
          codigo: formData.codigo.trim().toLowerCase().replace(/\s+/g, "_"),
          titulo: formData.titulo.trim(),
          descripcion: formData.descripcion.trim(),
          puntos: finalPuntos,
          icon_key,
          regla: formData.regla,
          umbral: finalUmbral,
          activo: Boolean(formData.activo),
          orden: finalOrden,
        });
        setSuccess("Insignia creada exitosamente.");
      }

      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la insignia.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (logro: LogroAdmin) => {
    setError(null);
    try {
      await updateLogro(logro.id, { activo: !logro.activo });
      setItems((prev) =>
        prev.map((item) => (item.id === logro.id ? { ...item, activo: !item.activo } : item)),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el estado.");
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setError(null);
    try {
      await deleteLogro(deletingId);
      setSuccess("Insignia eliminada / desactivada del catálogo.");
      setDeletingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la insignia.");
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = items.length;
    const activos = items.filter((i) => i.activo).length;
    const puntosTotales = items
      .filter((i) => i.activo)
      .reduce((sum, i) => sum + (Number(i.puntos) || 0), 0);
    const automaticos = items.filter(
      (i) => i.regla === "primera_vez" || i.regla === "adelanto_count",
    ).length;

    return { total, activos, puntosTotales, automaticos };
  }, [items]);

  // Filtrado
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const matchTitle = item.titulo.toLowerCase().includes(query);
        const matchCode = item.codigo.toLowerCase().includes(query);
        const matchDesc = item.descripcion.toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchDesc) return false;
      }
      if (filtroEstado === "activos" && !item.activo) return false;
      if (filtroEstado === "inactivos" && item.activo) return false;
      if (filtroRegla !== "all" && item.regla !== filtroRegla) return false;
      return true;
    });
  }, [items, busqueda, filtroEstado, filtroRegla]);

  const handleGenerateDefaultLogros = async () => {
    setGeneratingDefaults(true);
    setError(null);
    setSuccess(null);
    try {
      const existingCodes = new Set(items.map((i) => i.codigo));
      const toCreate = DEFAULT_STARTER_LOGROS.filter((d) => !existingCodes.has(d.codigo));

      for (const logro of toCreate) {
        await createLogro({
          codigo: logro.codigo.trim().toLowerCase().replace(/\s+/g, "_"),
          titulo: logro.titulo.trim(),
          descripcion: logro.descripcion?.trim() || "",
          puntos: Math.max(0, Math.round(Number(logro.puntos) || 100)),
          icon_key: logro.icon_key || "star",
          regla: logro.regla,
          umbral: logro.regla === "adelanto_count" ? Math.max(1, Number(logro.umbral) || 1) : null,
          activo: Boolean(logro.activo),
          orden: Number(logro.orden) || 0,
        });
      }

      setSuccess(`¡${toCreate.length} insignias por defecto creadas e integradas exitosamente!`);
      await load();
    } catch (err) {
      console.error("Error al generar insignias por defecto:", err);
      setError(
        err instanceof ApiError
          ? `${err.message}`
          : "Ocurrió un error al generar las insignias predeterminadas.",
      );
      await load();
    } finally {
      setGeneratingDefaults(false);
    }
  };

  const hasDefaultLogros = items.some((item) =>
    DEFAULT_STARTER_LOGROS.some((d) => d.codigo === item.codigo),
  );

  const showGenerateButton = !hasDefaultLogros && items.length < 10;

  return (
    <div key={animationKey} className="admin-page space-y-6">
      {/* HEADER DE LA PÁGINA */}
      <AdminPageHeader
        eyebrow="Gamificación"
        title="Logros e insignias"
        subtitle="Administra el catálogo de insignias, reglas de desbloqueo y recompensas en puntos para los empleados."
        aside={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {showGenerateButton && (
              <Button
                type="button"
                variant="outline"
                disabled={generatingDefaults || loading}
                onClick={() => void handleGenerateDefaultLogros()}
                className="h-10 gap-2 font-medium shadow-xs border-primary/40 text-primary hover:bg-primary/10 transition-all rounded-xl w-full sm:w-auto"
              >
                {generatingDefaults ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creando 10 insignias…
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4 text-primary" />
                    Generar 10 insignias por defecto
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              onClick={openCreateModal}
              className="h-10 gap-2 font-semibold shadow-sm shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl w-full sm:w-auto"
            >
              <Plus className="size-4" />
              Nueva insignia
            </Button>
          </div>
        }
      />

      {/* ALERTAS */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive flex items-center justify-between gap-3 animate-in fade-in">
          <span>{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="h-7 text-xs text-destructive hover:bg-destructive/10"
          >
            Cerrar
          </Button>
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {success}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSuccess(null)}
            className="h-7 text-xs text-emerald-700 hover:bg-emerald-500/10"
          >
            Cerrar
          </Button>
        </div>
      )}

      {/* METRIC CARDS / KPIS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <AdminMetricCard
          label="Total de insignias"
          value={
            loading ? "…" : (
              <AnimatedNumber value={kpis.total} animationKey={animationKey} delay={0} />
            )
          }
          subtext="Catálogo global configurado"
          icon={Trophy}
        />
        <AdminMetricCard
          label="Insignias activas"
          accent
          value={
            loading ? "…" : (
              <AnimatedNumber value={kpis.activos} animationKey={animationKey} delay={60} />
            )
          }
          subtext="Visibles para los empleados"
          icon={Sparkles}
        />
        <AdminMetricCard
          label="Puntos en juego"
          value={
            loading ? "…" : (
              <AnimatedNumber
                value={kpis.puntosTotales}
                animationKey={animationKey}
                delay={120}
              />
            )
          }
          subtext="Suma de puntos activos"
          icon={Coins}
        />
        <AdminMetricCard
          label="Reglas automáticas"
          value={
            loading ? "…" : (
              <AnimatedNumber
                value={kpis.automaticos}
                animationKey={animationKey}
                delay={180}
              />
            )
          }
          subtext="Desbloqueo por sistema"
          icon={Zap}
        />
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="admin-panel-card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, código o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 text-sm rounded-xl h-10"
            />
          </div>

          <div className="flex sm:hidden justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMobileFiltrosOpen((prev) => !prev)}
              className="gap-2 text-xs font-semibold h-9 rounded-xl border-primary/20 bg-primary/[0.04] text-primary"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Filtros</span>
              {(filtroEstado !== "all" || filtroRegla !== "all") && (
                <span className="size-2 rounded-full bg-primary animate-pulse" />
              )}
              {mobileFiltrosOpen ? (
                <ChevronUp className="size-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-3.5 text-muted-foreground" />
              )}
            </Button>

            {(busqueda || filtroEstado !== "all" || filtroRegla !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstado("all");
                  setFiltroRegla("all");
                }}
                className="text-xs text-muted-foreground h-8"
              >
                Limpiar
              </Button>
            )}
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center gap-2.5 w-full sm:w-auto",
              mobileFiltrosOpen ? "flex" : "hidden sm:flex",
            )}
          >
            <div className="w-full sm:w-auto min-w-[140px]">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activos">Solo activos</SelectItem>
                  <SelectItem value="inactivos">Solo inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto min-w-[170px]">
              <Select value={filtroRegla} onValueChange={setFiltroRegla}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Regla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las reglas</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="primera_vez">Primer adelanto</SelectItem>
                  <SelectItem value="adelanto_count">Por número de adelantos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(busqueda || filtroEstado !== "all" || filtroRegla !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstado("all");
                  setFiltroRegla("all");
                }}
                className="hidden sm:inline-flex h-10 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3">
          <span>
            Mostrando <strong>{filteredItems.length}</strong> de{" "}
            <strong>{items.length}</strong> insignias
          </span>
          <span className="text-[11px] font-mono">Catálogo sincronizado</span>
        </div>
      </div>

      {/* CATÁLOGO DE INSIGNIAS (GRID DE TARJETAS PREMIUM) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="admin-section-title text-base">Insignias y Recompensas</h2>
          <span className="text-xs text-muted-foreground">
            {filteredItems.length} registradas
          </span>
        </div>

        {loading ? (
          <div className="admin-panel-card p-12 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Cargando catálogo de insignias…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="admin-panel-card p-12 text-center space-y-4">
            <div className="size-16 rounded-3xl bg-primary/10 text-primary grid place-items-center mx-auto shadow-inner">
              <Trophy className="size-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="font-semibold text-foreground">No se encontraron insignias</p>
              <p className="text-xs text-muted-foreground">
                {items.length === 0
                  ? "Aún no has creado ninguna insignia de logro para los empleados."
                  : "No hay insignias que coincidan con los filtros seleccionados."}
              </p>
            </div>
            {items.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={generatingDefaults || loading}
                  onClick={() => void handleGenerateDefaultLogros()}
                  className="gap-2 font-medium text-xs rounded-xl border-primary/40 text-primary hover:bg-primary/10"
                >
                  {generatingDefaults ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creando 10 insignias…
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4 text-primary" />
                      Generar 10 insignias por defecto
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={openCreateModal}
                  className="gap-2 font-semibold text-xs rounded-xl"
                >
                  <Plus className="size-4" />
                  Crear primera insignia
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((logro) => {
              const { iconName, color } = parseIconKey(logro.icon_key);
              const reglaInfo = reglaLabel(logro.regla, logro.umbral);

              return (
                <div
                  key={logro.id}
                  className={cn(
                    "admin-nested-card flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 group hover:shadow-md hover:border-primary/40",
                    !logro.activo && "opacity-70 bg-muted/30",
                  )}
                >
                  <div className="space-y-4">
                    {/* Header de la tarjeta con Insignia + Estado + Puntos */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <LogroBadgeIcon
                          iconName={iconName}
                          color={color}
                          size="md"
                          showGlow={logro.activo}
                          className="group-hover:scale-105"
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base text-foreground truncate">
                            {logro.titulo}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground truncate">
                              #{logro.codigo}
                            </span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              Orden: {logro.orden}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Puntos Badge */}
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold text-xs tabular px-2.5 py-1 rounded-lg shrink-0 gap-1"
                      >
                        <Coins className="size-3" />+{logro.puntos} pts
                      </Badge>
                    </div>

                    {/* Descripción */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[32px]">
                      {logro.descripcion || "Sin descripción configurada."}
                    </p>

                    {/* Regla y Condiciones */}
                    <div className="rounded-xl bg-muted/40 border border-border/60 p-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                          Regla de activación
                        </span>
                        <p className="font-medium text-foreground truncate mt-0.5">
                          {reglaInfo.label}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal text-muted-foreground bg-card shrink-0"
                      >
                        {logro.regla}
                      </Badge>
                    </div>
                  </div>

                  {/* Footer de Acciones y Toggle */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`switch-${logro.id}`}
                        checked={logro.activo}
                        onCheckedChange={() => void handleToggleActivo(logro)}
                      />
                      <Label
                        htmlFor={`switch-${logro.id}`}
                        className={cn(
                          "text-xs cursor-pointer font-medium",
                          logro.activo
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {logro.activo ? "Activo" : "Inactivo"}
                      </Label>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(logro)}
                        className="h-8 text-xs gap-1.5 rounded-lg"
                      >
                        <Edit2 className="size-3.5" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(logro.id)}
                        className="h-8 size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Eliminar insignia"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE CREAR / EDITAR INSIGNIA */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border shadow-2xl">
          <div className="p-5 border-b border-border bg-muted/30">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                {editingId ? "Editar insignia de logro" : "Nueva insignia de logro"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configura el diseño visual, puntos y condiciones de desbloqueo para los empleados.
              </DialogDescription>
            </DialogHeader>

            {/* VISTA PREVIA EN VIVO DE LA TARJETA DENTRO DEL MODAL */}
            <div className="mt-4 p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-4">
              <LogroBadgeIcon
                iconName={formData.iconName}
                color={formData.color}
                size="lg"
                showGlow
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm text-foreground truncate">
                    {formData.titulo || "Título de la insignia"}
                  </h4>
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold px-2 py-0.5 shrink-0"
                  >
                    +{formData.puntos || 0} pts
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {formData.descripcion || "Descripción motivacional del logro..."}
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-[11px] text-muted-foreground">
                  <span className="font-mono">#{formData.codigo || "codigo_logro"}</span>
                  <span>·</span>
                  <span>{reglaLabel(formData.regla, formData.umbral).label}</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* SELECTOR DE ICONO Y COLOR */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Icono y Color de la Insignia</Label>
              <IconPickerButton
                iconName={formData.iconName}
                color={formData.color}
                onClick={() => setPickerOpen(true)}
              />
            </div>

            {/* TÍTULO Y CÓDIGO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="form-titulo" className="text-xs font-semibold">
                  Título de la insignia *
                </Label>
                <Input
                  id="form-titulo"
                  value={formData.titulo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((f) => ({
                      ...f,
                      titulo: val,
                      // Autogenerar código si es nuevo y el código actual está vacío o autogenerado
                      codigo:
                        !editingId && (!f.codigo || f.codigo === f.titulo.toLowerCase().replace(/\s+/g, "_"))
                          ? val.toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s+/g, "_")
                          : f.codigo,
                    }));
                  }}
                  placeholder="Ej. Primer Adelanto Éxito"
                  required
                  className="rounded-xl h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="form-codigo" className="text-xs font-semibold">
                    Código único (Slug) *
                  </Label>
                  <button
                    type="button"
                    onClick={() => setInfoModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                  >
                    <HelpCircle className="size-3.5" />
                    ¿Qué es esto y cómo crearla?
                  </button>
                </div>
                <Select
                  value={formData.isCustomSlug ? "custom" : formData.codigo || "primer_paso"}
                  onValueChange={(val) => {
                    if (val === "custom") {
                      setFormData((f) => ({ ...f, isCustomSlug: true }));
                    } else {
                      setFormData((f) => ({ ...f, codigo: val, isCustomSlug: false }));
                    }
                  }}
                  disabled={Boolean(editingId)}
                >
                  <SelectTrigger id="form-codigo" className="h-10 rounded-xl font-mono text-xs">
                    <SelectValue placeholder="Seleccionar slug..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {editingId && !PREDEFINED_SLUGS.some((s) => s.value === formData.codigo) && (
                      <SelectItem value={formData.codigo} className="font-mono text-xs">
                        {formData.codigo} (actual)
                      </SelectItem>
                    )}
                    {PREDEFINED_SLUGS.map((slug) => (
                      <SelectItem key={slug.value} value={slug.value} className="font-mono text-xs">
                        {slug.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.isCustomSlug && !editingId && (
                  <Input
                    id="form-codigo-custom"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        codigo: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      }))
                    }
                    placeholder="ej. mi_logro_personalizado"
                    required
                    className="rounded-xl h-9 font-mono text-xs mt-1.5 animate-in fade-in"
                  />
                )}
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="space-y-1.5">
              <Label htmlFor="form-descripcion" className="text-xs font-semibold">
                Descripción motivacional
              </Label>
              <Textarea
                id="form-descripcion"
                rows={2}
                value={formData.descripcion}
                onChange={(e) => setFormData((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Explica qué hizo el empleado para desbloquear este logro..."
                className="rounded-xl text-xs resize-none"
              />
            </div>

            {/* PUNTOS Y REGLA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="form-puntos" className="text-xs font-semibold">
                  Puntos otorgados
                </Label>
                <Input
                  id="form-puntos"
                  type="number"
                  min={0}
                  value={formData.puntos}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, puntos: Number(e.target.value) || 0 }))
                  }
                  className="rounded-xl h-10 text-sm tabular"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="form-regla" className="text-xs font-semibold">
                  Regla de desbloqueo
                </Label>
                <Select
                  value={formData.regla}
                  onValueChange={(val) =>
                    setFormData((f) => ({
                      ...f,
                      regla: val as CrearLogroPayload["regla"],
                    }))
                  }
                >
                  <SelectTrigger id="form-regla" className="h-10 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (Asignación libre)</SelectItem>
                    <SelectItem value="primera_vez">Primer adelanto completado</SelectItem>
                    <SelectItem value="adelanto_count">Por conteo de adelantos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* UMBRAL CONDICIONAL (SI ES ADELANTO_COUNT) */}
            {formData.regla === "adelanto_count" && (
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/[0.04] space-y-1.5 animate-in fade-in">
                <Label htmlFor="form-umbral" className="text-xs font-semibold text-primary">
                  Umbral: Número de adelantos requeridos
                </Label>
                <Input
                  id="form-umbral"
                  type="number"
                  min={1}
                  value={formData.umbral ?? 1}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      umbral: e.target.value ? Number(e.target.value) : 1,
                    }))
                  }
                  className="rounded-xl h-10 text-sm tabular bg-card"
                  placeholder="Ej. 5"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  El empleado recibirá esta insignia automáticamente cuando complete{" "}
                  <strong>{formData.umbral ?? 1}</strong> adelantos.
                </p>
              </div>
            )}

            {/* ORDEN Y ESTADO ACTIVO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div className="space-y-1.5">
                <Label htmlFor="form-orden" className="text-xs font-semibold">
                  Orden de visualización
                </Label>
                <Input
                  id="form-orden"
                  type="number"
                  value={formData.orden}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, orden: Number(e.target.value) || 0 }))
                  }
                  className="rounded-xl h-10 text-sm tabular"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20 mt-1">
                <div>
                  <Label htmlFor="form-activo" className="text-xs font-semibold cursor-pointer">
                    Insignia activa
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Visible para los empleados</p>
                </div>
                <Switch
                  id="form-activo"
                  checked={formData.activo}
                  onCheckedChange={(v) => setFormData((f) => ({ ...f, activo: v }))}
                />
              </div>
            </div>

            <DialogFooter className="p-0 pt-4 border-t border-border flex sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Guardando…
                  </>
                ) : editingId ? (
                  <>
                    <Save className="size-4" />
                    Guardar cambios
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Crear insignia
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SELECTOR DE ICONO Y COLOR POPUP */}
      <IconColorPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedIcon={formData.iconName}
        selectedColor={formData.color}
        onSelect={handleIconColorSelected}
      />

      {/* CONFIRMACIÓN DE ELIMINACIÓN */}
      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta insignia de logro?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Esta acción desactivará o eliminará la insignia del catálogo general. Los empleados ya
              no podrán desbloquearla.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* GUÍA EXPLICATIVA PASO A PASO PARA EL USUARIO */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-border shadow-2xl rounded-2xl">
          <div className="p-5 border-b border-border bg-gradient-to-r from-purple-500/10 via-primary/5 to-blue-500/10">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/10 text-primary grid place-items-center shrink-0 shadow-inner">
                  <Lightbulb className="size-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Guía Rápida: ¿Cómo crear una insignia?
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Aprende qué significa cada dato de forma simple y sin tecnicismos.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Card explicativa destacada: ¿Qué es el Código único o Slug? */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border-amber-500/30 text-[11px] px-2.5 py-0.5"
                >
                  💡 ¿Qué es el "Código único (Slug)"?
                </Badge>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                Es como la <strong>"cédula o nombre interno"</strong> que utiliza el sistema para reconocer la insignia y saber cuándo entregarla automáticamente a los empleados.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                👉 <strong>No te preocupes por nombres técnicos:</strong> simplemente abre la lista y elige el que más se parezca a lo que premia la insignia (por ejemplo, <code className="bg-background/80 px-1.5 py-0.5 rounded font-mono text-primary font-semibold">primer_paso</code> si es el primer adelanto, o <code className="bg-background/80 px-1.5 py-0.5 rounded font-mono text-primary font-semibold">finanzas_al_dia</code> si completó 3 adelantos).
              </p>
            </div>

            {/* Pasos */}
            <div className="space-y-2.5">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                Paso a Paso para configurar tu insignia:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Paso 1 */}
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-md bg-primary/10 text-primary font-bold text-[11px] grid place-items-center">
                      1
                    </div>
                    <span className="font-semibold text-foreground text-xs">Icono y Color</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Elige el símbolo (trofeo, cohete, estrella, alcancía) y el color que más resalte en la pantalla del empleado.
                  </p>
                </div>

                {/* Paso 2 */}
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-md bg-primary/10 text-primary font-bold text-[11px] grid place-items-center">
                      2
                    </div>
                    <span className="font-semibold text-foreground text-xs">Título y Mensaje</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Escribe un nombre motivador (ej. <em>Planificador Estrella</em>) y una frase animando al trabajador.
                  </p>
                </div>

                {/* Paso 3 */}
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-md bg-primary/10 text-primary font-bold text-[11px] grid place-items-center">
                      3
                    </div>
                    <span className="font-semibold text-foreground text-xs">Puntos Otorgados</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Define los puntos de recompensa que sumará el empleado para subir de nivel y motivación.
                  </p>
                </div>

                {/* Paso 4 */}
                <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="size-5 rounded-md bg-primary/10 text-primary font-bold text-[11px] grid place-items-center">
                      4
                    </div>
                    <span className="font-semibold text-foreground text-xs">Regla de Entrega</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Elige si se desbloquea <strong>automáticamente</strong> al pedir adelantos o de forma <strong>manual</strong> cuando tú quieras premiar.
                  </p>
                </div>
              </div>
            </div>

            {/* Tip adicional */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                <strong className="text-foreground">Consejo para ahorrar tiempo:</strong> Puedes usar el botón <em>"Generar 10 insignias por defecto"</em> y el sistema creará automáticamente las 10 insignias ideales prediseñadas.
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
            <Button
              type="button"
              onClick={() => setInfoModalOpen(false)}
              className="font-semibold text-xs rounded-xl px-5"
            >
              ¡Entendido, gracias!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
