import { API_ENDPOINTS, fetchApi } from "@/lib/api-config";

export interface EmpresaSeguro {
  EMPRESA: string;
  NOMBRE: string;
  RUC?: string;
  DIRECCION?: string;
  TELEFONO?: string;
}

function extractList(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.content)) return raw.content;
  return [];
}

function normalize(raw: any): EmpresaSeguro {
  return {
    EMPRESA: String(
      raw.EMPRESA ?? raw.EMPRESASEGURO ?? raw.empresa ?? raw.empresaSeguro ?? raw.empresaseguro ?? ""
    ).trim(),
    NOMBRE: String(raw.NOMBRE ?? raw.nombre ?? "").trim(),
    RUC: String(raw.RUC ?? raw.ruc ?? "").trim(),
    DIRECCION: String(raw.DIRECCION ?? raw.direccion ?? "").trim(),
    TELEFONO: String(raw.TELEFONO ?? raw.telefono ?? "").trim(),
  };
}

/**
 * Obtiene todas las empresas de seguro desde Spring Boot.
 * Endpoint: GET /api/maestro/empresaseguro/obtener-todos
 */
export async function getAllEmpresasSeguro(): Promise<EmpresaSeguro[]> {
  const url = API_ENDPOINTS.utils.empresasSeguro;  const response = await fetchApi(url, {
    headers: { accept: "*/*" },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const raw = await response.json();
  const list = extractList(raw);
  return list.map(normalize);
}
