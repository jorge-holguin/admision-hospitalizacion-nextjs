/**
 * Utility functions for handling civil status codes and descriptions
 */

export type CivilStatusCode = 'S' | 'C' | '0' | 'K' | 'D' | 'P' | 'V' | 'E' | string;

export const civilStatusMap: Record<CivilStatusCode, string> = {
  'S': 'Soltero(a)',
  'C': 'Casado(a)',
  '0': '*Ninguno',
  'K': 'Conviviente',
  'D': 'Divorciado(a)',
  'P': 'Separado(a)',
  'V': 'Viudo(a)',
  'E': 'Ex Conviviente',
  // Add variants with spaces to handle data inconsistencies
  'S ': 'Soltero(a)',
  'C ': 'Casado(a)',
  '0 ': '*Ninguno',
  'K ': 'Conviviente',
  'D ': 'Divorciado(a)',
  'P ': 'Separado(a)',
  'V ': 'Viudo(a)',
  'E ': 'Ex Conviviente',
};

/**
 * Converts a civil status code to its full description
 * @param code The civil status code, description, or object containing civil status info
 * @returns The full description of the civil status or the original code if not found
 */
export const getCivilStatusDescription = (code: CivilStatusCode | object | Array<any> | null | undefined): string => {
  if (code == null || code === '') return 'No especificado';

  // Handle arrays: use first non-empty element
  if (Array.isArray(code)) {
    const first = code.find((item) => item != null && item !== '');
    return first ? getCivilStatusDescription(first) : 'No especificado';
  }

  // Handle objects: try description fields first, then code fields
  if (typeof code === 'object' && code !== null) {
    const obj = code as any;
    const possibleValue =
      obj.descripcion ??
      obj.nombre ??
      obj.label ??
      obj.estadoCivil ??
      obj.ESTADO_CIVIL ??
      obj.maritalStatus ??
      obj.codigo ??
      obj.code ??
      obj.value ??
      obj.id;

    if (possibleValue != null && possibleValue !== '') {
      // Avoid infinite recursion with self-referential objects
      if (possibleValue === code) return 'No especificado';
      return getCivilStatusDescription(possibleValue);
    }
    return 'No especificado';
  }

  // Trim the code to handle cases where there might be trailing spaces
  const trimmedCode = String(code).trim();
  return civilStatusMap[trimmedCode] || trimmedCode;
};

// Mapa inverso: descripción -> código
const descriptionToCode: Record<string, CivilStatusCode> = {
  'soltero': 'S',
  'soltera': 'S',
  'casado': 'C',
  'casada': 'C',
  'conviviente': 'K',
  'concubinato': 'K',
  'divorciado': 'D',
  'divorciada': 'D',
  'separado': 'P',
  'separada': 'P',
  'viudo': 'V',
  'viuda': 'V',
  'ex conviviente': 'E',
  'exconviviente': 'E',
  'ninguno': '0',
  'ninguna': '0',
  'no especificado': '0',
};

/**
 * Convierte una descripción o código de estado civil a su código válido.
 * @param value Código o descripción
 * @param desc Descripción alternativa (opcional)
 * @returns Código válido (S, C, K, D, P, V, E, 0) o cadena vacía si no se reconoce
 */
export const getCivilStatusCode = (value: any, desc?: any): string => {
  if (value == null || value === '') {
    if (desc == null || desc === '') return '';
    value = desc;
  }

  const raw = String(value).trim().toUpperCase();
  if (!raw) return '';

  // Si ya es un código válido (con o sin espacio), devolverlo limpio
  const clean = raw.trim();
  if (civilStatusMap[clean] || civilStatusMap[raw]) {
    return clean;
  }

  // Si no, buscar en la descripción
  const descRaw = String(desc ?? value).toLowerCase();
  for (const [key, code] of Object.entries(descriptionToCode)) {
    if (descRaw.includes(key)) return code;
  }

  return '';
};
