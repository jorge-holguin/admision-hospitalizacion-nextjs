/**
 * Utilidades para normalización de códigos de seguro en búsquedas de cuentas.
 */

/**
 * Normaliza el tipo de seguro al código que la base de datos usa para agrupar
 * cuentas activas.
 *
 * Reglas:
 * - '0' o '00' -> '0' (Pagante)
 * - '02' -> '02' (SOAT)
 * - '20', '21', '22', '23', '24', '25' -> '01' (SIS; todas son sub-categorías SIS)
 * - Cualquier otro valor -> '01' (SIS por defecto)
 */
export function normalizarSeguroCuenta(tipoSeguro: string | null | undefined): string {
  if (!tipoSeguro) {
    return '01';
  }

  const seguroTrimmed = String(tipoSeguro).trim();

  if (seguroTrimmed === '0' || seguroTrimmed === '00') {
    return '0'; // Pagante
  }

  if (seguroTrimmed === '02') {
    return '02'; // SOAT
  }

  if (['20', '21', '22', '23', '24', '25'].includes(seguroTrimmed)) {
    return '01'; // SIS: 01 abarca 20-25
  }

  return '01'; // Default SIS
}
