"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Define la interfaz para los datos de cuenta
interface PatientAccountData {
  cuentaId: string;
}

// Define la interfaz para el contexto
interface PatientAccountContextType {
  accountData: Record<string, PatientAccountData | null>;
  setAccountData: (patientId: string, data: PatientAccountData | null) => void;
  getAccountData: (patientId: string) => PatientAccountData | null;
  isLoading: Record<string, boolean>;
  setLoading: (patientId: string, loading: boolean) => void;
  errors: Record<string, string | null>;
  setError: (patientId: string, error: string | null) => void;
  fetchPatientAccount: (patientId: string) => Promise<PatientAccountData | null>;
}

// Crear el contexto
const PatientAccountContext = createContext<PatientAccountContextType | undefined>(undefined);

// Mantener un registro de las solicitudes en vuelo para evitar duplicados
const inFlightRequests: Record<string, Promise<PatientAccountData | null>> = {};

// Componente proveedor
export const PatientAccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accountData, setAccountDataState] = useState<Record<string, PatientAccountData | null>>({});
  const [isLoading, setLoadingState] = useState<Record<string, boolean>>({});
  const [errors, setErrorState] = useState<Record<string, string | null>>({});

  const setAccountData = (patientId: string, data: PatientAccountData | null) => {
    setAccountDataState(prev => ({
      ...prev,
      [patientId]: data
    }));
  };

  const getAccountData = (patientId: string): PatientAccountData | null => {
    return accountData[patientId] || null;
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

  // Función para obtener la cuenta del paciente
  const fetchPatientAccount = useCallback(async (patientId: string): Promise<PatientAccountData | null> => {
    if (!patientId) return null;
    
    // Verificar si ya tenemos los datos en el contexto
    const existingData = getAccountData(patientId);
    if (existingData) {
      console.log(`Usando datos de cuenta en caché para paciente: ${patientId}`);
      return existingData;
    }
    
    // Verificar si ya hay una solicitud en vuelo para este paciente
    if (patientId in inFlightRequests) {
      console.log(`Reutilizando solicitud en vuelo para cuenta de paciente: ${patientId}`);
      return inFlightRequests[patientId];
    }

    // Crear una nueva solicitud y almacenarla
    const fetchPromise = (async () => {
      try {
        setLoading(patientId, true);
        setError(patientId, null);

        console.log(`Obteniendo cuenta activa para paciente: ${patientId}`);
        const response = await fetch(`/api/cuenta/${patientId}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener cuenta: ${response.status}`);
        }

        const data = await response.json();
        
        if (data?.success && data?.data?.cuentaId) {
          console.log(`Cuenta encontrada: ${data.data.cuentaId}`);
          const accountInfo: PatientAccountData = {
            cuentaId: data.data.cuentaId
          };
          
          setAccountData(patientId, accountInfo);
          return accountInfo;
        } else {
          console.log(`No se encontró cuenta activa para paciente ${patientId}`);
          setAccountData(patientId, null);
          return null;
        }
      } catch (err: any) {
        console.error('Error al obtener cuenta del paciente:', err);
        setError(patientId, err.message || 'Error al obtener cuenta del paciente');
        setAccountData(patientId, null);
        return null;
      } finally {
        setLoading(patientId, false);
        // Eliminar la solicitud en vuelo cuando termine
        delete inFlightRequests[patientId];
      }
    })();
    
    // Almacenar la promesa
    inFlightRequests[patientId] = fetchPromise;
    return fetchPromise;
  }, []);

  return (
    <PatientAccountContext.Provider value={{
      accountData,
      setAccountData,
      getAccountData,
      isLoading,
      setLoading,
      errors,
      setError,
      fetchPatientAccount
    }}>
      {children}
    </PatientAccountContext.Provider>
  );
};

// Hook personalizado para usar el contexto de cuenta del paciente
export const usePatientAccount = () => {
  const context = useContext(PatientAccountContext);
  if (context === undefined) {
    throw new Error('usePatientAccount debe usarse dentro de un PatientAccountProvider');
  }
  return context;
};
