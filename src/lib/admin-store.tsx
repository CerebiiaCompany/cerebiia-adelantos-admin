import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_MAX_CUOTAS, clampNumeroCuotas, inferNumeroCuotas, assignNumeroCuotasDemo } from "@/lib/adelanto-calculo";
import type { CuentaCobro } from "@/lib/cuenta-cobro";
import { calcularMontosCobro } from "@/lib/cuenta-cobro";
import { aplicarCuotasPorVerificacion } from "@/lib/cuotas-adelanto";
import { DEFAULT_COMISION_VALOR, readComisionCache } from "@/lib/adelanto-calculo";
import { leerAuditorias, registrarAuditoriaAdelanto, type RegistroAuditoria } from "@/lib/auditoria";
import type { RegistroCuota } from "@/lib/cuotas-adelanto";

export type Empresa = {
  id: string;
  nombre: string;
  nit: string;
  adminNombre: string;
  adminEmail: string;
  adminPassword: string;
  activa: boolean;
  createdAt: string;
};

export type TipoDocumento = "CC" | "CE" | "PPT";
export type TipoContrato = "Término Indefinido" | "Término Fijo" | "Aprendizaje" | "Obra o labor";

export type Empleado = {
  id: string;
  empresaId: string;
  nombre: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  salario: number;
  banco: string;
  numeroCuenta: string;
  tipoCuenta: "Ahorros" | "Corriente";
  email: string;
  celular: string;
  tipoContrato: TipoContrato;
};

export const SALDO_DISPONIBLE_PORCENTAJE = 0.3;

export function calcularSaldoDisponible(salario: number): number {
  return Math.round(salario * SALDO_DISPONIBLE_PORCENTAJE);
}

export function empleadoCoincideAdelanto(empleado: Empleado, adelanto: Adelanto): boolean {
  if (adelanto.empresaId !== empleado.empresaId) return false;
  if (adelanto.empleadoCedula === empleado.documento) return true;
  return adelanto.empleadoNombre.toLowerCase() === empleado.nombre.toLowerCase();
}

export function sumarMontoAdelantado(adelantos: Adelanto[]): number {
  return adelantos.reduce((sum, a) => sum + a.monto, 0);
}

export function sumarMontoPagado(adelantos: Adelanto[]): number {
  return adelantos
    .filter((a) => a.estado === "pagado")
    .reduce((sum, a) => sum + a.monto, 0);
}

export function calcularTotalAdelantadoEmpleado(empleado: Empleado, adelantos: Adelanto[]): number {
  return adelantos
    .filter((a) => empleadoCoincideAdelanto(empleado, a) && a.estado !== "rechazado")
    .reduce((sum, a) => sum + a.monto, 0);
}

export function calcularTotalPagadoEmpleado(empleado: Empleado, adelantos: Adelanto[]): number {
  return adelantos
    .filter((a) => empleadoCoincideAdelanto(empleado, a) && a.estado === "pagado")
    .reduce((sum, a) => sum + a.monto, 0);
}

export type EstadoAdelanto = "solicitado" | "en_revision" | "aprobado" | "pagado" | "rechazado";

export type Adelanto = {
  id: string;
  empresaId: string;
  empleadoNombre: string;
  empleadoCedula: string;
  monto: number;
  numeroCuotas: number;
  fechaSolicitud: string; // ISO
  estado: EstadoAdelanto;
  cuenta: {
    banco: string;
    tipo: "Ahorros" | "Corriente";
    numero: string;
  };
  comprobanteUrl?: string;
  fechaPago?: string;
  motivoRechazo?: string;
  fechaRechazo?: string;
  cuentaCobroId?: string;
  cuotasActivadas?: boolean;
  registroCuotas?: RegistroCuota[];
};

type Store = {
  empresas: Empresa[];
  adelantos: Adelanto[];
  empleados: Empleado[];
  cuentasCobro: CuentaCobro[];
  auditorias: RegistroAuditoria[];
  addEmpresa: (e: Omit<Empresa, "id" | "createdAt" | "activa"> & { activa?: boolean }) => void;
  toggleEmpresa: (id: string) => void;
  updateAdelantoEstado: (id: string, estado: EstadoAdelanto) => void;
  rechazarAdelanto: (id: string, motivoRechazo: string) => void;
  marcarPagado: (id: string, comprobanteUrl: string) => void;
  crearCuentaCobro: (
    empresaId: string,
    periodo: string,
    adelantoIds: string[],
    valorComision: string | number,
  ) => CuentaCobro | null;
  adjuntarDocumentoCobro: (cuentaId: string, documentoNombre: string) => void;
  registrarEvidenciaPagoEmpresa: (cuentaId: string, evidenciaNombre: string) => void;
  verificarCuentaCobro: (cuentaId: string) => void;
  rechazarEvidenciaCuenta: (cuentaId: string, nota: string) => void;
};

const StoreCtx = createContext<Store | null>(null);
const STORAGE_KEY = "lov_admin_data_v1";
const CUOTAS_DEMO_MIGRATION_KEY = "lov_admin_cuotas_demo_v1";

function seedEmpleados(empresas: Empresa[]): Empleado[] {
  const plantilla: Omit<Empleado, "id" | "empresaId">[] = [
    {
      nombre: "Juan Gómez",
      tipoDocumento: "CC",
      documento: "1098765432",
      salario: 2500000,
      banco: "Bancolombia",
      numeroCuenta: "12345678901",
      tipoCuenta: "Ahorros",
      email: "juan.gomez@empresa.co",
      celular: "3001234567",
      tipoContrato: "Término Indefinido",
    },
    {
      nombre: "María López",
      tipoDocumento: "CC",
      documento: "1087654321",
      salario: 1800000,
      banco: "Daviplata",
      numeroCuenta: "3019876543",
      tipoCuenta: "Ahorros",
      email: "maria.lopez@empresa.co",
      celular: "3109876543",
      tipoContrato: "Término Fijo",
    },
    {
      nombre: "Pedro Sánchez",
      tipoDocumento: "CC",
      documento: "1076543210",
      salario: 3200000,
      banco: "Nequi",
      numeroCuenta: "3207654321",
      tipoCuenta: "Ahorros",
      email: "pedro.sanchez@empresa.co",
      celular: "3158765432",
      tipoContrato: "Término Indefinido",
    },
    {
      nombre: "Sofía Ramírez",
      tipoDocumento: "CC",
      documento: "1065432109",
      salario: 1500000,
      banco: "BBVA",
      numeroCuenta: "9876543210",
      tipoCuenta: "Corriente",
      email: "sofia.ramirez@empresa.co",
      celular: "3187654321",
      tipoContrato: "Aprendizaje",
    },
  ];

  const empleados: Empleado[] = [];
  let counter = 0;

  for (const empresa of empresas) {
    for (const base of plantilla) {
      counter++;
      empleados.push({
        ...base,
        id: `emp${counter}`,
        empresaId: empresa.id,
        email: base.email.replace("@empresa.co", `@${empresa.nombre.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")}.co`),
      });
    }
  }

  return empleados;
}

function seed(): { empresas: Empresa[]; adelantos: Adelanto[]; empleados: Empleado[] } {
  const empresas: Empresa[] = [
    { id: "e1", nombre: "TechCorp S.A.S", nit: "900123456-1", adminNombre: "Laura Méndez", adminEmail: "laura@techcorp.co", adminPassword: "", activa: true, createdAt: "2025-01-12" },
    { id: "e2", nombre: "Innovate Ltda", nit: "901234567-2", adminNombre: "Carlos Ruiz", adminEmail: "carlos@innovate.co", adminPassword: "", activa: true, createdAt: "2025-02-03" },
    { id: "e3", nombre: "Verde Energy", nit: "902345678-3", adminNombre: "Ana Torres", adminEmail: "ana@verde.co", adminPassword: "", activa: true, createdAt: "2025-03-20" },
    { id: "e4", nombre: "Café del Norte", nit: "903456789-4", adminNombre: "Miguel Soto", adminEmail: "miguel@cafenorte.co", adminPassword: "", activa: false, createdAt: "2024-11-08" },
    { id: "e5", nombre: "Logística Andina", nit: "904567890-5", adminNombre: "Diana Pérez", adminEmail: "diana@andina.co", adminPassword: "", activa: true, createdAt: "2025-04-15" },
  ];

  const bancos = ["Bancolombia", "Davivienda", "BBVA", "Banco de Bogotá", "Nequi"];
  const nombres = ["Juan Gómez", "María López", "Pedro Sánchez", "Sofía Ramírez", "Andrés Vargas", "Camila Rojas", "Felipe Castro", "Valentina Díaz", "Sebastián Moreno", "Isabella Cruz"];
  const estados: EstadoAdelanto[] = ["solicitado", "en_revision", "aprobado"];
  const adelantos: Adelanto[] = [];
  let counter = 0;
  // Generate over last 6 months
  const now = new Date(2026, 5, 24); // Jun 24, 2026
  for (let m = 0; m < 6; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const perMonth = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < perMonth; i++) {
      counter++;
      const empresa = empresas[Math.floor(Math.random() * 4)]; // skip last
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const dia = 1 + Math.floor(Math.random() * 27);
      const fecha = new Date(monthDate.getFullYear(), monthDate.getMonth(), dia);
      const monto = 200000 + Math.floor(Math.random() * 30) * 50000;
      const estado = estados[Math.floor(Math.random() * estados.length)];
      const numeroCuotas = assignNumeroCuotasDemo(counter - 1);
      adelantos.push({
        id: `a${counter}`,
        empresaId: empresa.id,
        empleadoNombre: nombre,
        empleadoCedula: String(1000000000 + Math.floor(Math.random() * 99999999)),
        monto,
        numeroCuotas,
        fechaSolicitud: fecha.toISOString(),
        estado,
        cuenta: {
          banco: bancos[Math.floor(Math.random() * bancos.length)],
          tipo: Math.random() > 0.5 ? "Ahorros" : "Corriente",
          numero: String(Math.floor(1000000000 + Math.random() * 8999999999)),
        },
      });
    }
  }
  return { empresas, adelantos, empleados: seedEmpleados(empresas) };
}

function normalizeAdelanto(raw: Adelanto): Adelanto {
  const numeroCuotas = raw.numeroCuotas && raw.numeroCuotas >= 1
    ? clampNumeroCuotas(raw.numeroCuotas, DEFAULT_MAX_CUOTAS)
    : inferNumeroCuotas(raw.id, DEFAULT_MAX_CUOTAS);
  return { ...raw, numeroCuotas };
}

function applyCuotasDemoMigration(adelantos: Adelanto[]): Adelanto[] {
  if (typeof window === "undefined") return adelantos;
  if (localStorage.getItem(CUOTAS_DEMO_MIGRATION_KEY)) return adelantos;

  const next = adelantos.map((a, i) => ({
    ...a,
    numeroCuotas: assignNumeroCuotasDemo(i),
  }));
  localStorage.setItem(CUOTAS_DEMO_MIGRATION_KEY, "1");
  return next;
}

function load(): {
  empresas: Empresa[];
  adelantos: Adelanto[];
  empleados: Empleado[];
  cuentasCobro: CuentaCobro[];
} {
  if (typeof window === "undefined") {
    return { empresas: [], adelantos: [], empleados: [], cuentasCobro: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        empresas: Empresa[];
        adelantos: Adelanto[];
        empleados?: Empleado[];
        cuentasCobro?: CuentaCobro[];
      };
      if (!parsed.empleados?.length) {
        parsed.empleados = seedEmpleados(parsed.empresas ?? []);
      }
      const adelantos = applyCuotasDemoMigration(
        (parsed.adelantos ?? []).map(normalizeAdelanto),
      );
      const data = {
        empresas: (parsed.empresas ?? []).map(normalizeEmpresa),
        adelantos,
        empleados: parsed.empleados ?? [],
        cuentasCobro: parsed.cuentasCobro ?? [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch {}
  const seeded = seed();
  const data = { ...seeded, cuentasCobro: [] as CuentaCobro[] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function normalizeEmpresa(raw: Empresa & { sector?: string }): Empresa {
  const { sector: _sector, ...empresa } = raw;
  return {
    ...empresa,
    adminPassword: empresa.adminPassword ?? "",
  };
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cuentasCobro, setCuentasCobro] = useState<CuentaCobro[]>([]);
  const [auditorias, setAuditorias] = useState<RegistroAuditoria[]>([]);

  const refreshAuditorias = useCallback(() => {
    setAuditorias(leerAuditorias());
  }, []);

  useEffect(() => {
    const data = load();
    setEmpresas(data.empresas);
    setAdelantos(data.adelantos);
    setEmpleados(data.empleados);
    setCuentasCobro(data.cuentasCobro);
    setAuditorias(leerAuditorias());
  }, []);

  const persist = useCallback(
    (e: Empresa[], a: Adelanto[], emp: Empleado[], cc: CuentaCobro[]) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ empresas: e, adelantos: a, empleados: emp, cuentasCobro: cc }),
      );
    },
    [],
  );

  const addEmpresa: Store["addEmpresa"] = (e) => {
    setEmpresas((prev) => {
      const next: Empresa[] = [
        ...prev,
        {
          ...e,
          id: `e${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
          activa: e.activa ?? true,
        },
      ];
      persist(next, adelantos, empleados, cuentasCobro);
      return next;
    });
  };

  const toggleEmpresa: Store["toggleEmpresa"] = (id) => {
    setEmpresas((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, activa: !x.activa } : x));
      persist(next, adelantos, empleados, cuentasCobro);
      return next;
    });
  };

  const updateAdelantoEstado: Store["updateAdelantoEstado"] = (id, estado) => {
    const actual = adelantos.find((x) => x.id === id);
    if (!actual || actual.estado === estado) return;
    if (actual.estado === "pagado" || estado === "pagado" || estado === "rechazado") return;

    registrarAuditoriaAdelanto(actual, estado);
    refreshAuditorias();

    setAdelantos((prev) => {
      const next = prev.map((x) => {
        if (x.id !== id) return x;
        const { motivoRechazo: _m, fechaRechazo: _f, ...rest } = x;
        return { ...rest, estado };
      });
      persist(empresas, next, empleados, cuentasCobro);
      return next;
    });
  };

  const rechazarAdelanto: Store["rechazarAdelanto"] = (id, motivoRechazo) => {
    const nota = motivoRechazo.trim();
    if (!nota) return;

    const actual = adelantos.find((x) => x.id === id);
    if (actual && actual.estado !== "rechazado") {
      registrarAuditoriaAdelanto(actual, "rechazado", nota);
      refreshAuditorias();
    }

    setAdelantos((prev) => {
      const next = prev.map((x) =>
        x.id === id
          ? {
              ...x,
              estado: "rechazado" as EstadoAdelanto,
              motivoRechazo: nota,
              fechaRechazo: new Date().toISOString(),
            }
          : x,
      );
      persist(empresas, next, empleados, cuentasCobro);
      return next;
    });
  };

  const marcarPagado: Store["marcarPagado"] = (id, comprobanteUrl) => {
    const url = comprobanteUrl.trim();
    if (!url) return;

    const actual = adelantos.find((x) => x.id === id);
    if (actual?.estado === "aprobado") {
      registrarAuditoriaAdelanto(actual, "pagado", "Comprobante de pago adjuntado");
      refreshAuditorias();
    }

    setAdelantos((prev) => {
      const next = prev.map((x) => {
        if (x.id !== id) return x;
        if (x.estado !== "aprobado") return x;
        return {
          ...x,
          estado: "pagado" as EstadoAdelanto,
          comprobanteUrl: url,
          fechaPago: new Date().toISOString(),
          cuotasActivadas: false,
        };
      });
      persist(empresas, next, empleados, cuentasCobro);
      return next;
    });
  };

  const crearCuentaCobro: Store["crearCuentaCobro"] = (
    empresaId,
    periodo,
    adelantoIds,
    valorComision,
  ) => {
    const lista = adelantos.filter(
      (a) =>
        a.empresaId === empresaId &&
        a.estado === "pagado" &&
        adelantoIds.includes(a.id) &&
        !a.cuentaCobroId,
    );
    if (!lista.length) return null;

    const existe = cuentasCobro.find((c) => c.empresaId === empresaId && c.periodo === periodo);
    if (existe) return existe;

    const montos = calcularMontosCobro(lista, valorComision);
    const nueva: CuentaCobro = {
      id: `cc${Date.now()}`,
      empresaId,
      periodo,
      adelantoIds: lista.map((a) => a.id),
      ...montos,
      fechaEmision: new Date().toISOString(),
      estado: "borrador",
    };

    const nextCc = [...cuentasCobro, nueva];
    const nextA = adelantos.map((a) =>
      nueva.adelantoIds.includes(a.id) ? { ...a, cuentaCobroId: nueva.id } : a,
    );
    setCuentasCobro(nextCc);
    setAdelantos(nextA);
    persist(empresas, nextA, empleados, nextCc);
    return nueva;
  };

  const adjuntarDocumentoCobro: Store["adjuntarDocumentoCobro"] = (cuentaId, documentoNombre) => {
    const nombre = documentoNombre.trim();
    if (!nombre) return;

    setCuentasCobro((prev) => {
      const next = prev.map((c) =>
        c.id === cuentaId
          ? { ...c, documentoCobroNombre: nombre, estado: "emitida" as const }
          : c,
      );
      persist(empresas, adelantos, empleados, next);
      return next;
    });
  };

  const registrarEvidenciaPagoEmpresa: Store["registrarEvidenciaPagoEmpresa"] = (
    cuentaId,
    evidenciaNombre,
  ) => {
    const nombre = evidenciaNombre.trim();
    if (!nombre) return;

    setCuentasCobro((prev) => {
      const next = prev.map((c) =>
        c.id === cuentaId
          ? {
              ...c,
              evidenciaPagoNombre: nombre,
              fechaEvidencia: new Date().toISOString(),
              estado: "evidencia_enviada" as const,
            }
          : c,
      );
      persist(empresas, adelantos, empleados, next);
      return next;
    });
  };

  const verificarCuentaCobro: Store["verificarCuentaCobro"] = (cuentaId) => {
    const cuenta = cuentasCobro.find((c) => c.id === cuentaId);
    if (!cuenta || cuenta.estado !== "evidencia_enviada") return;

    const valorComision = readComisionCache() ?? DEFAULT_COMISION_VALOR;

    const nextCc = cuentasCobro.map((c) =>
      c.id === cuentaId
        ? {
            ...c,
            estado: "verificada" as const,
            fechaVerificacion: new Date().toISOString(),
          }
        : c,
    );
    const nextA = adelantos.map((a) =>
      cuenta.adelantoIds.includes(a.id)
        ? aplicarCuotasPorVerificacion(a, cuenta.id, cuenta.periodo, valorComision)
        : a,
    );
    setCuentasCobro(nextCc);
    setAdelantos(nextA);
    persist(empresas, nextA, empleados, nextCc);
  };

  const rechazarEvidenciaCuenta: Store["rechazarEvidenciaCuenta"] = (cuentaId, nota) => {
    const motivo = nota.trim();
    if (!motivo) return;

    setCuentasCobro((prev) => {
      const next = prev.map((c) =>
        c.id === cuentaId
          ? { ...c, estado: "rechazada" as const, notaRevision: motivo }
          : c,
      );
      persist(empresas, adelantos, empleados, next);
      return next;
    });
  };

  const value = useMemo<Store>(
    () => ({
      empresas,
      adelantos,
      empleados,
      cuentasCobro,
      auditorias,
      addEmpresa,
      toggleEmpresa,
      updateAdelantoEstado,
      rechazarAdelanto,
      marcarPagado,
      crearCuentaCobro,
      adjuntarDocumentoCobro,
      registrarEvidenciaPagoEmpresa,
      verificarCuentaCobro,
      rechazarEvidenciaCuenta,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [empresas, adelantos, empleados, cuentasCobro, auditorias],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useAdmin must be used inside AdminStoreProvider");
  return ctx;
}

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export const estadoLabel: Record<EstadoAdelanto, string> = {
  solicitado: "Solicitado",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  pagado: "Pagado",
  rechazado: "Rechazado",
};
