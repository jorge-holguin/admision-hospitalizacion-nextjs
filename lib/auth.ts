// Authentication utility functions

const API_BASE_URL = "http://192.168.0.17:9006";

// User interface based on JWT payload
export interface UserInfo {
  puesto?: string;
  idDepartamento?: number;
  hostname?: string;
  roles?: string[];
  ip?: string;
  primerInicio?: boolean;
  idMedico?: string;
  idServicio?: number;
  nombreCompleto?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}

/**
 * Refreshes the authentication token
 * @param token Current JWT token
 * @returns New JWT token or null if refresh failed
 */
export async function refreshToken(token: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    const data = await response.json();
    
    if (data.success && data.data && data.data.jwt) {
      return data.data.jwt;
    }
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Gets the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

/**
 * Sets the authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

/**
 * Removes the authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

/**
 * Decodes a JWT token and returns the payload
 */
export function decodeToken(token: string): UserInfo | null {
  try {
    // JWT token consists of three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // The payload is the second part, base64 encoded
    const payload = parts[1];
    const decodedPayload = atob(payload);
    const userInfo = JSON.parse(decodedPayload) as UserInfo;
    
    return userInfo;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Gets the current user information from the JWT token
 */
export function getCurrentUser(): UserInfo | null {
  const token = getAuthToken();
  if (!token) return null;
  
  return decodeToken(token);
}

/**
 * Checks if the user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;
  
  // You could add token validation logic here if needed
  return true;
}
