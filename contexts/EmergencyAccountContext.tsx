"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Define la interfaz para los datos de cuenta de emergencia
interface EmergencyAccountData {
  cuentaId: string;
}

// Define la interfaz para el contexto
interface EmergencyAccountContextType {
  accountData: Record<string, EmergencyAccountData | null>;
  setAccountData: (patientId: string, data: EmergencyAccountData | null, tipoSeguro?: string) => void;
  getAccountData: (patientId: string, tipoSeguro?: string) => EmergencyAccountData | null;
  isLoading: Record<string, boolean>;
  setLoading: (patientId: string, loading: boolean) => void;
  errors: Record<string, string | null>;
  setError: (patientId: string, error: string | null) => void;
  fetchEmergencyAccount: (patientId: string, tipoSeguro: string) => Promise<EmergencyAccountData | null>;
}

// Crear el contexto
const EmergencyAccountContext = createContext<EmergencyAccountContextType | undefined>(undefined);

// Mantener un registro de las solicitudes en vuelo para evitar duplicados
const inFlightRequests: Record<string, Promise<EmergencyAccountData | null>> = {};

// Componente proveedor
export const EmergencyAccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accountData, setAccountDataState] = useState<Record<string, EmergencyAccountData | null>>({});
  const [isLoading, setLoadingState] = useState<Record<string, boolean>>({});
  const [errors, setErrorState] = useState<Record<string, string | null>>({});

  const setAccountData = (patientId: string, data: EmergencyAccountData | null, tipoSeguro?: string) => {
    const key = tipoSeguro ? `${patientId}_${tipoSeguro}` : patientId;
    setAccountDataState(prev => ({
      ...prev,
      [key]: data,
      [patientId]: data // Mantener compatibilidad
    }));
  };

  const getAccountData = (patientId: string, tipoSeguro?: string): EmergencyAccountData | null => {
    const key = tipoSeguro ? `${patientId}_${tipoSeguro}` : patientId;
    return accountData[key] || accountData[patientId] || null;
  };

  const setLoading = (patientId: string, loading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [patientId]: loading
    }));
  };

  const setError = (patientId: string, error: string | null) => {
    setErrorState(prev => ({
      ...prev,
      [patientId]: error
    }));
  };

  // Función para obtener la cuenta del paciente para EMERGENCIAS
  // Usa el endpoint: /api/accounts/search-by-insurance/[pacienteId]?seguro=X
  const fetchEmergencyAccount = useCallback(async (patientId: string, tipoSeguro: string): Promise<EmergencyAccountData | null> => {
    if (!patientId || !tipoSeguro) return null;
    
    const cacheKey = `${patientId}_${tipoSeguro}`;
    
    // Verificar si ya tenemos los datos en el contexto con esta combinación específica
    const existingData = getAccountData(patientId, tipoSeguro);
    if (existingData) {
      console.log(`🚨 [CACHE HIT] Usando datos de cuenta en caché para paciente: ${patientId}, seguro: ${tipoSeguro}`);
      return existingData;
    }
    
    // Verificar si ya hay una solicitud en vuelo para este paciente
    if (cacheKey in inFlightRequests) {
      console.log(`🚨 Reutilizando solicitud en vuelo para cuenta de emergencia: ${patientId}`);
      return inFlightRequests[cacheKey];
    }

    // Crear una nueva solicitud y almacenarla
    const fetchPromise = (async () => {
      try {
        setLoading(patientId, true);
        setError(patientId, null);

        console.log(`🚨 [EMERGENCIA] Obteniendo cuenta para paciente: ${patientId} con seguro: ${tipoSeguro}`);
        console.log(`🚨 [EMERGENCIA] Endpoint: /api/accounts/search-by-insurance/${patientId}?seguro=${tipoSeguro}`);
        
        const response = await fetch(`/api/accounts/search-by-insurance/${patientId}?seguro=${tipoSeguro}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log(`🚨 [EMERGENCIA] No se encontró cuenta para paciente ${patientId} con seguro ${tipoSeguro}`);
            return null;
          }
          throw new Error(`Error al obtener cuenta de emergencia: ${response.status}`);
        }

        const data = await response.json();
        
        // El endpoint buscar-por-seguro devuelve: { success, message, cuentaId }
        if (data?.success && data?.cuentaId) {
          console.log(`✅ [EMERGENCIA] Cuenta encontrada: ${data.cuentaId}`);
          const accountInfo: EmergencyAccountData = {
            cuentaId: data.cuentaId
          };
          
          setAccountData(patientId, accountInfo, tipoSeguro);
          return accountInfo;
        } else {
          console.log(`❌ [EMERGENCIA] No se encontró cuenta activa para paciente ${patientId}`);
          setAccountData(patientId, null, tipoSeguro);
          return null;
        }
      } catch (err: any) {
        console.error('❌ [EMERGENCIA] Error al obtener cuenta del paciente:', err);
        setError(patientId, err.message || 'Error al obtener cuenta del paciente');
        setAccountData(patientId, null, tipoSeguro);
        return null;
      } finally {
        setLoading(patientId, false);
        // Eliminar la solicitud en vuelo cuando termine
        delete inFlightRequests[cacheKey];
      }
    })();
    
    // Almacenar la promesa
    inFlightRequests[cacheKey] = fetchPromise;
    return fetchPromise;
  }, []);

  return (
    <EmergencyAccountContext.Provider value={{
      accountData,
      setAccountData,
      getAccountData,
      isLoading,
      setLoading,
      errors,
      setError,
      fetchEmergencyAccount
    }}>
      {children}
    </EmergencyAccountContext.Provider>
  );
};

// Hook personalizado para usar el contexto de cuenta de emergencia
export const useEmergencyAccount = () => {
  const context = useContext(EmergencyAccountContext);
  if (context === undefined) {
    throw new Error('useEmergencyAccount debe usarse dentro de un EmergencyAccountProvider');
  }
  return context;
};
