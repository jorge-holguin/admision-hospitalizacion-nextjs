/**
 * Utilidades para normalizar y mapear tipos de documento.
 *
 * El sistema antiguo espera códigos cortos (D, CE, PP, etc.), pero algunos
 * flujos envían el nombre completo ("Carnet de Extranjería", "Pasaporte", ...).
 * Esta utilidad normaliza cualquier representación al código que el backend
 * acepta.
 */

export const TIPO_DOCUMENTO_MAP: Record<string, string> = {
  D: 'DNI',
  LM: 'Libreta Militar',
  CE: 'Carnet de Extranjería',
  '0': '*Ninguno',
  PN: 'Partida Nacimiento',
  CS: 'Carnet de Seguro',
  CP: 'CIP (Policía)',
  CI: 'CUI',
  RN: 'RECIEN NACIDO (DOC.MADRE + H)',
  PP: 'Pasaporte',
  CIE: 'Cédula de Identidad Extranjera',
  CNV: 'Certificado de nacido vivo',
};

const KNOWN_CODES = Object.keys(TIPO_DOCUMENTO_MAP);

/**
 * Convierte un nombre largo o cualquier representación de tipo de documento
 * al código de 1-3 caracteres esperado por el backend.
 *
 * Ejemplos:
 *   - "Carnet de Extranjería" -> "CE"
 *   - "  CE  " -> "CE"
 *   - "DNI" -> "D"
 *   - "Pasaporte" -> "PP"
 *   - "0" / "*Ninguno" -> "0"
 */
export function normalizeTipoDocumento(value: string | undefined | null): string {
  if (!value) return 'D';

  const raw = String(value).trim();
  if (!raw) return 'D';

  const upper = raw.toUpperCase();

  // Si ya es un código conocido (posiblemente con padding), devolverlo limpio
  const cleanCode = upper.replace(/\s+/g, '');
  if (KNOWN_CODES.includes(cleanCode)) {
    return cleanCode;
  }

  // Si coincide con el nombre largo de algún código, devolver el código
  for (const [code, name] of Object.entries(TIPO_DOCUMENTO_MAP)) {
    if (upper === name.toUpperCase()) {
      return code;
    }
  }

  // Búsqueda por contenido: "Carnet de Extranjería X" -> "CE"
  const contentMappings: Record<string, string> = {
    'CARNET DE EXTRANJERIA': 'CE',
    'CARNET EXTRANJERIA': 'CE',
    'EXTRANJERIA': 'CE',
    'PASAPORTE': 'PP',
    'DNI': 'D',
    'LIBRETA MILITAR': 'LM',
    'PARTIDA NACIMIENTO': 'PN',
    'CARNET DE SEGURO': 'CS',
    'CARNET SEGURO': 'CS',
    'CIP POLICIA': 'CP',
    'POLICIA': 'CP',
    'CUI': 'CI',
    'RECIEN NACIDO': 'RN',
    'NACIDO VIVO': 'CNV',
    'CERTIFICADO NACIDO VIVO': 'CNV',
    'CEDULA DE IDENTIDAD EXTRANJERA': 'CIE',
    'IDENTIDAD EXTRANJERA': 'CIE',
    'NINGUNO': '0',
  };

  for (const [needle, code] of Object.entries(contentMappings)) {
    if (upper.includes(needle)) {
      return code;
    }
  }

  // Fallback: si recibimos "C" podría ser CE en contexto de SIS, pero por defecto
  // devolvemos el valor tal cual si parece un código corto (≤4 caracteres sin espacios)
  if (raw.replace(/\s+/g, '').length <= 4) {
    return raw.replace(/\s+/g, '').toUpperCase();
  }

  console.warn(`⚠️ Tipo de documento no mapeado: "${raw}". Usando 'D' por defecto.`);
  return 'D';
}

/**
 * Verifica si un valor de tipo de documento ya está normalizado.
 */
export function isNormalizedTipoDocumento(value: string | undefined | null): boolean {
  if (!value) return false;
  const clean = String(value).trim().toUpperCase().replace(/\s+/g, '');
  return KNOWN_CODES.includes(clean);
}
