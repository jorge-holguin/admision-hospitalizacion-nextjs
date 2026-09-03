"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { getAuthToken } from '@/lib/auth';
import { extractDocumentFromToken } from '@/utils/jwtUtils';

const S028_CODE = 'S028';
const STORAGE_KEY = 's028_permissions_v2';
const API_AUTH = import.meta.env.VITE_AUTH_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PermissionsContextType {
  permissions: Set<string>;
  hasPermission: (code: string) => boolean;
  isLoaded: boolean;
  reloadPermissions: () => Promise<void>;
  clearPermissions: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectOpciones(modules: any[]): string[] {
  const codes: string[] = [];
  for (const mod of modules ?? []) {
    if (!mod) continue;

    // Opciones directas del módulo (formato EMER/FIL: modulos[].opciones[])
    for (const opcion of mod.opciones ?? []) {
      if (opcion?.codigo) codes.push(opcion.codigo as string);
    }

    // Opciones dentro de menus (formato anterior)
    for (const menu of mod.menus ?? []) {
      for (const opcion of menu?.opciones ?? []) {
        if (opcion?.codigo) codes.push(opcion.codigo as string);
      }
    }

    // Submódulos anidados (formato S028 contiene modulos[])
    if (mod.modulos) {
      codes.push(...collectOpciones(mod.modulos));
    }
  }
  return codes;
}

function extractS028Permissions(payload: any): Set<string> {
  const codes = new Set<string>();
  try {
    const modulos: any[] =
      payload?.modulos ??
      payload?.data?.modulos ??
      [];

    // Si el payload es directamente el módulo S028 con submódulos, incluir ambos niveles
    if (payload?.codigo === S028_CODE || payload?.codigo?.startsWith(S028_CODE)) {
      modulos.push(payload);
    }

    for (const code of collectOpciones(modulos)) {
      codes.add(code);
    }  } catch {
    // ignore parse errors — fallback is full access
  }
  return codes;
}

function loadCached(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set<string>(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveCached(codes: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...codes]));
  } catch {}
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const reloadPermissions = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoaded(true);
      return;
    }

    // Apply cached value immediately so UI is not blocked
    const cached = loadCached();
    if (cached.size > 0) {
      setPermissions(cached);
      setIsLoaded(true);
    }

    // Fetch fresh permissions from the auth API
    if (!API_AUTH) {
      console.warn('⚠️ NEXT_PUBLIC_AUTH_API_URL no configurada — permisos S028 deshabilitados (acceso total)');
      setIsLoaded(true);
      return;
    }

    const documento = extractDocumentFromToken();
    if (!documento) {
      console.warn('⚠️ No se pudo extraer el documento del token — permisos S028 deshabilitados (acceso total)');
      setIsLoaded(true);
      return;
    }

    try {
      const response = await fetch(`${API_AUTH}/api/v1/usuarios/permisos/${documento}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.warn(`⚠️ Permisos S028: respuesta ${response.status} — usando acceso total como fallback`);
        setIsLoaded(true);
        return;
      }

      const data = await response.json();
      const codes = extractS028Permissions(data?.data ?? data);

      if (codes.size > 0) {
        saveCached(codes);
        setPermissions(codes);      } else {
        console.warn('⚠️ Módulo S028 no encontrado en permisos — acceso total como fallback');
      }
    } catch (err) {
      console.warn('⚠️ No se pudieron cargar permisos S028 — acceso total como fallback', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const clearPermissions = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setPermissions(new Set());
    setIsLoaded(false);
  }, []);

  useEffect(() => {
    reloadPermissions();
  }, [reloadPermissions]);

  /**
   * hasPermission(code)
   *
   * Returns true if:
   *  - The permissions set is empty (no S028 module found → full access fallback), OR
   *  - The code is explicitly present in the set.
   *
   * Returns false only when permissions WERE loaded AND the code is NOT in the set.
   */
  const hasPermission = useCallback(
    (code: string): boolean => {
      if (permissions.size === 0) return true; // fallback: full access
      return permissions.has(code);
    },
    [permissions]
  );

  return (
    <PermissionsContext.Provider
      value={{ permissions, hasPermission, isLoaded, reloadPermissions, clearPermissions }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within a PermissionsProvider');
  return ctx;
}
