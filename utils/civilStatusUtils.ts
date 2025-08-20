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
 * @param code The civil status code
 * @returns The full description of the civil status or the original code if not found
 */
export const getCivilStatusDescription = (code: CivilStatusCode | null | undefined): string => {
  if (!code) return 'No especificado';
  // Trim the code to handle cases where there might be trailing spaces
  const trimmedCode = code.toString().trim();
  return civilStatusMap[trimmedCode] || trimmedCode;
};
