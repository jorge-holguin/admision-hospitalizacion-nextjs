/**
 * Utility functions for working with JWT tokens
 */

/**
 * Extracts the first surname from the user's full name in the JWT token
 * @returns The first surname or a default value if extraction fails
 */
export const extractUserSurnameFromToken = (): string => {
  try {
    // Obtener el token del localStorage
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return 'SUPERVISOR';
    
    // Decodificar el token (solo la parte del payload)
    const tokenParts = authToken.split('.');
    if (tokenParts.length !== 3) return 'SUPERVISOR';
    
    // Decodificar la parte del payload (segunda parte)
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Extraer el nombre completo
    const nombreCompleto = payload.nombreCompleto;
    if (!nombreCompleto) return 'SUPERVISOR';
    
    // Obtener el primer apellido (primera palabra)
    const primerApellido = nombreCompleto.split(' ')[0];
    return primerApellido || 'SUPERVISOR';
  } catch (error) {
    console.error('Error al extraer el primer apellido del token:', error);
    return 'SUPERVISOR';
  }
};
