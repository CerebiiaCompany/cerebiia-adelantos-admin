import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Empresa = {
  id: string;
  nombre: string;
  nit: string;
  sector: string;
  adminNombre: string;
  adminEmail: string;
  activa: boolean;
  createdAt: string;
};

export type EstadoAdelanto = "solicitado" | "en_revision" | "aprobado" | "pagado" | "rechazado";

export type Adelanto = {
  id: string;
  empresaId: string;
  empleadoNombre: string;
  empleadoCedula: string;
  monto: number;
  fechaSolicitud: string; // ISO
  estado: EstadoAdelanto;
  cuenta: {
    banco: string;
    tipo: "Ahorros" | "Corriente";
    numero: string;
  };
  comprobanteUrl?: string;
  fechaPago?: string;
};

type Store = {
  empresas: Empresa[];
  adelantos: Adelanto[];
  addEmpresa: (e: Omit<Empresa, "id" | "createdAt" | "activa"> & { activa?: boolean }) => void;
  toggleEmpresa: (id: string) => void;
  updateAdelantoEstado: (id: string, estado: EstadoAdelanto) => void;
  marcarPagado: (id: string, comprobanteUrl: string) => void;
};

const StoreCtx = createContext<Store | null>(null);
const STORAGE_KEY = "lov_admin_data_v1";

function seed(): { empresas: Empresa[]; adelantos: Adelanto[] } {
  const empresas: Empresa[] = [
    { id: "e1", nombre: "TechCorp S.A.S", nit: "900123456-1", sector: "Tecnología", adminNombre: "Laura Méndez", adminEmail: "laura@techcorp.co", activa: true, createdAt: "2025-01-12" },
    { id: "e2", nombre: "Innovate Ltda", nit: "901234567-2", sector: "Consultoría", adminNombre: "Carlos Ruiz", adminEmail: "carlos@innovate.co", activa: true, createdAt: "2025-02-03" },
    { id: "e3", nombre: "Verde Energy", nit: "902345678-3", sector: "Energía", adminNombre: "Ana Torres", adminEmail: "ana@verde.co", activa: true, createdAt: "2025-03-20" },
    { id: "e4", nombre: "Café del Norte", nit: "903456789-4", sector: "Alimentos", adminNombre: "Miguel Soto", adminEmail: "miguel@cafenorte.co", activa: false, createdAt: "2024-11-08" },
    { id: "e5", nombre: "Logística Andina", nit: "904567890-5", sector: "Transporte", adminNombre: "Diana Pérez", adminEmail: "diana@andina.co", activa: true, createdAt: "2025-04-15" },
  ];

  const bancos = ["Bancolombia", "Davivienda", "BBVA", "Banco de Bogotá", "Nequi"];
  const nombres = ["Juan Gómez", "María López", "Pedro Sánchez", "Sofía Ramírez", "Andrés Vargas", "Camila Rojas", "Felipe Castro", "Valentina Díaz", "Sebastián Moreno", "Isabella Cruz"];
  const estados: EstadoAdelanto[] = ["solicitado", "en_revision", "aprobado", "pagado", "rechazado"];
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
      // weight: more pagado for old months
      const estadoIdx = m >= 2 ? (Math.random() < 0.7 ? 3 : Math.floor(Math.random() * 5)) : Math.floor(Math.random() * 5);
      const estado = estados[estadoIdx];
      adelantos.push({
        id: `a${counter}`,
        empresaId: empresa.id,
        empleadoNombre: nombre,
        empleadoCedula: String(1000000000 + Math.floor(Math.random() * 99999999)),
        monto,
        fechaSolicitud: fecha.toISOString(),
        estado,
        cuenta: {
          banco: bancos[Math.floor(Math.random() * bancos.length)],
          tipo: Math.random() > 0.5 ? "Ahorros" : "Corriente",
          numero: String(Math.floor(1000000000 + Math.random() * 8999999999)),
        },
        comprobanteUrl: estado === "pagado" ? "comprobante.pdf" : undefined,
        fechaPago: estado === "pagado" ? new Date(fecha.getTime() + 86400000 * 2).toISOString() : undefined,
      });
    }
  }
  return { empresas, adelantos };
}

function load(): { empresas: Empresa[]; adelantos: Adelanto[] } {
  if (typeof window === "undefined") return { empresas: [], adelantos: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seeded = seed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);

  useEffect(() => {
    const data = load();
    setEmpresas(data.empresas);
    setAdelantos(data.adelantos);
  }, []);

  const persist = useCallback((e: Empresa[], a: Adelanto[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ empresas: e, adelantos: a }));
  }, []);

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
      persist(next, adelantos);
      return next;
    });
  };

  const toggleEmpresa: Store["toggleEmpresa"] = (id) => {
    setEmpresas((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, activa: !x.activa } : x));
      persist(next, adelantos);
      return next;
    });
  };

  const updateAdelantoEstado: Store["updateAdelantoEstado"] = (id, estado) => {
    setAdelantos((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, estado } : x));
      persist(empresas, next);
      return next;
    });
  };

  const marcarPagado: Store["marcarPagado"] = (id, comprobanteUrl) => {
    setAdelantos((prev) => {
      const next = prev.map((x) =>
        x.id === id
          ? { ...x, estado: "pagado" as EstadoAdelanto, comprobanteUrl, fechaPago: new Date().toISOString() }
          : x,
      );
      persist(empresas, next);
      return next;
    });
  };

  const value = useMemo<Store>(
    () => ({ empresas, adelantos, addEmpresa, toggleEmpresa, updateAdelantoEstado, marcarPagado }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [empresas, adelantos],
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
