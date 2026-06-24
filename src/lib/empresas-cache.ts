import type { ApiEmpresa, User } from "@/lib/api/types";

const STORAGE_KEY = "cerebiia_sa_empresas_v1";

export type EmpresaListRow = {
  empresaId: string;
  userId: string;
  nombre: string;
  nit: string;
  adminNombre: string;
  adminEmail: string;
  activa: boolean;
  createdAt: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadEmpresasCache(): ApiEmpresa[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ApiEmpresa[];
  } catch {
    return [];
  }
}

export function saveEmpresaToCache(empresa: ApiEmpresa): void {
  if (!isBrowser()) return;
  const current = loadEmpresasCache();
  const next = [...current.filter((e) => e.id !== empresa.id && e.user_id !== empresa.user_id), empresa];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function mergeEmpresaRows(users: User[], cache: ApiEmpresa[]): EmpresaListRow[] {
  const empresaUsers = users.filter((u) => u.role === "empresa");
  const byUserId = new Map(cache.map((e) => [e.user_id, e]));

  const rows: EmpresaListRow[] = empresaUsers.map((user) => {
    const cached = byUserId.get(user.id);
    return {
      empresaId: cached?.id ?? user.id,
      userId: user.id,
      nombre: cached?.nombre ?? "—",
      nit: cached?.nit ?? "—",
      adminNombre: user.full_name,
      adminEmail: user.email,
      activa: user.is_active,
      createdAt: cached?.created_at ?? user.created_at,
    };
  });

  for (const empresa of cache) {
    if (!empresaUsers.some((u) => u.id === empresa.user_id)) {
      rows.push({
        empresaId: empresa.id,
        userId: empresa.user_id,
        nombre: empresa.nombre,
        nit: empresa.nit,
        adminNombre: "—",
        adminEmail: "—",
        activa: false,
        createdAt: empresa.created_at,
      });
    }
  }

  return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
