"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { filiacionService } from '@/services/hospitalizacion/filiacionService';
import { getCivilStatusCode } from '@/utils/civilStatusUtils';

// Define the patient data interface
interface PatientData {
  // Campos principales
  paciente: string;
  nombres: string;
  nombre: string;
  historia: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  documento: string;
  tipoDocumento: string;
  fechaNacimiento: string; // Formato: YYYY-MM-DD
  FECHA_NACIMIENTO?: string; // Alias para compatibilidad con API
  edad: string;
  EDAD?: string; // Alias para compatibilidad con API
  sexo: string;
  estadoCivil: string;
  ESTADO_CIVIL?: string;
  direccion: string;
  distrito: string;
  distritoDir: string;
  provinciaDir: string;
  departamentoDir: string;
  telefono1: string;
  telefono2: string;
  seguro: string;
  descSeguro: string;
  religion?: string;
  descreligion?: string;
  nombreLocalidad?: string;
  localidad?: string;
  nombreOcupacion?: string;
  photo?: string;
  
  // Campos de ubigeo y lugar de nacimiento
  COD_DISTRITO?: string;
  LUGAR_NACIMIENTO?: string;
  
  // Campos adicionales de filiación
  COD_ETNIA?: string;
  CONYUGE_NOMBRE?: string;
  CONYUGE_OCUPACION?: string;
  DIRECCION_RENIEC?: string;
  DISTRITO_RENIEC?: string;
  Departamento_Dir?: string;
  EMAIL?: string;
  FECHA_APERTURA?: any;
  GRADO_INSTRUCCION?: string;
  HIJOS?: any;
  HORA_APERTURA?: string;
  MADRE?: string;
  NOMBRE_DOCUMENTO?: string;
  NOMBRE_ESTADO_CIVIL?: string;
  NOMBRE_SEGURO?: string;
  OCUPACION?: string;
  PADRE?: string;
  PAIS?: string;
  RESPONSABLE_DIRECCION?: string;
  RESPONSABLE_NOMBRE?: string;
  RESPONSABLE_OCUPACION?: string;
  RESPONSABLE_PARENTESCO?: string;
  RESPONSABLE_TELEFONO?: string;
  RESPONSABLE_TRABAJO?: string;
  STRING_FOTO?: string;
  RowNum?: string;
  
  // Permitir campos adicionales dinámicos
  [key: string]: any;
}

// Define the context interface
interface PatientDataContextType {
  patientData: Record<string, PatientData>;
  setPatientData: (patientId: string, data: PatientData) => void;
  getPatientData: (patientId: string) => PatientData | null;
  invalidatePatientData: (patientId: string) => void;
  isLoading: Record<string, boolean>;
  setLoading: (patientId: string, loading: boolean) => void;
  errors: Record<string, string | null>;
  setError: (patientId: string, error: string | null) => void;
}

// Create the context
const PatientDataContext = createContext<PatientDataContextType | undefined>(undefined);

// Provider component
export const PatientDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patientData, setPatientDataState] = useState<Record<string, PatientData>>({});
  const [isLoading, setLoadingState] = useState<Record<string, boolean>>({});
  const [errors, setErrorState] = useState<Record<string, string | null>>({});

  const setPatientData = (patientId: string, data: PatientData) => {
    setPatientDataState(prev => ({
      ...prev,
      [patientId]: data
    }));
  };

  const getPatientData = (patientId: string): PatientData | null => {
    return patientData[patientId] || null;
  };

  const invalidatePatientData = (patientId: string) => {
    setPatientDataState(prev => {
      const newState = { ...prev };
      delete newState[patientId];
      return newState;
    });
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

  return (
    <PatientDataContext.Provider value={{
      patientData,
      setPatientData,
      getPatientData,
      invalidatePatientData,
      isLoading,
      setLoading,
      errors,
      setError
    }}>
      {children}
    </PatientDataContext.Provider>
  );
};

// Custom hook to use the patient data context
export const usePatientData = () => {
  const context = useContext(PatientDataContext);
  if (context === undefined) {
    throw new Error('usePatientData must be used within a PatientDataProvider');
  }
  return context;
};

// Keep track of in-flight requests to prevent duplicates
const inFlightRequests: Record<string, Promise<PatientData | null>> = {};

// Hook to fetch patient data
export const useFetchPatientData = (patientId: string | null | undefined) => {
  const { getPatientData, setPatientData, setLoading, setError, isLoading, errors, invalidatePatientData } = usePatientData();
  
  // Use a ref to track the current patientId to avoid stale closures
  const patientIdRef = React.useRef(patientId);
  React.useEffect(() => {
    patientIdRef.current = patientId;
  }, [patientId]);

  const fetchPatientData = React.useCallback(async (forceRefresh: boolean = false) => {
    const currentPatientId = patientIdRef.current;
    if (!currentPatientId) return null;
    
    // Check if we already have the data in context (skip if forceRefresh)
    if (!forceRefresh) {
      const existingData = getPatientData(currentPatientId);
      if (existingData) {
        return existingData;
      }
    } else {
      // Invalidate existing data when forcing refresh
      invalidatePatientData(currentPatientId);
    }
    
    // Check if there's already a request in flight for this patient
    if (currentPatientId in inFlightRequests) {
      return inFlightRequests[currentPatientId];
    }

    // Create a new request and store it
    const fetchPromise = (async () => {
      try {
        setLoading(currentPatientId, true);
        setError(currentPatientId, null);

        const paciente = await filiacionService.getFiliacionById(currentPatientId);

        if (!paciente) {
          throw new Error('No se encontraron datos del paciente');
        }

        const patientInfo: PatientData = {
          paciente: paciente.PACIENTE || currentPatientId,
          nombres: paciente.NOMBRES || '',
          nombre: paciente.NOMBRE || '',
          historia: paciente.HISTORIA || '',
          apellidoPaterno: paciente.PATERNO || '',
          apellidoMaterno: paciente.MATERNO || '',
          documento: paciente.DOCUMENTO || '',
          tipoDocumento: paciente.TIPO_DOCUMENTO || '',
          fechaNacimiento: String(paciente.FECHA_NACIMIENTO || ''),
          FECHA_NACIMIENTO: String(paciente.FECHA_NACIMIENTO || ''), // Mantener mayúsculas para compatibilidad con API
          edad: String(paciente.EDAD || ''),
          EDAD: String(paciente.EDAD || ''), // Mantener mayúsculas para compatibilidad con API
          sexo: paciente.SEXO || '',
          estadoCivil: getCivilStatusCode(paciente.ESTADO_CIVIL || paciente.estadoCivil, paciente.NOMBRE_ESTADO_CIVIL || paciente.nombreEstadoCivil),
          ESTADO_CIVIL: getCivilStatusCode(paciente.ESTADO_CIVIL || paciente.estadoCivil, paciente.NOMBRE_ESTADO_CIVIL || paciente.nombreEstadoCivil),
          NOMBRE_ESTADO_CIVIL: paciente.NOMBRE_ESTADO_CIVIL || paciente.nombreEstadoCivil || '',
          direccion: paciente.DIRECCION || '',
          distrito: typeof paciente.DISTRITO === 'string' ? paciente.DISTRITO : typeof paciente.DISTRITO === 'object' ? ((paciente.DISTRITO as any)?.distrito || (paciente.DISTRITO as any)?.ubigeo || '') : '',
          distritoDir: typeof paciente.Distrito_Dir === 'string' ? paciente.Distrito_Dir : typeof paciente.Distrito_Dir === 'object' ? ((paciente.Distrito_Dir as any)?.distrito || (paciente.Distrito_Dir as any)?.ubigeo || '') : '',
          provinciaDir: typeof paciente.Provincia_Dir === 'string' ? paciente.Provincia_Dir : typeof paciente.Provincia_Dir === 'object' ? ((paciente.Provincia_Dir as any)?.provincia || (paciente.Provincia_Dir as any)?.ubigeo || '') : '',
          departamentoDir: typeof paciente.Departamento_Dir === 'string' ? paciente.Departamento_Dir : typeof paciente.Departamento_Dir === 'object' ? ((paciente.Departamento_Dir as any)?.departamento || (paciente.Departamento_Dir as any)?.ubigeo || '') : '',
          telefono1: paciente.TELEFONO1 || '',
          telefono2: paciente.TELEFONO2 || '',
          seguro: typeof paciente.SEGURO === 'string' ? paciente.SEGURO : String(paciente.SEGURO ?? ''),
          descSeguro: typeof paciente.NOMBRE_SEGURO === 'string' ? paciente.NOMBRE_SEGURO : String(paciente.NOMBRE_SEGURO ?? ''),
          religion: paciente.RELIGION || '',
          descreligion: paciente.DESRELIGION || '',
          localidad: paciente.LOCALIDAD || '',
          nombreLocalidad: paciente.Nombre_Localidad || '',
          nombreOcupacion: paciente.NOMBRE_OCUPACION || '',
          photo: processPhotoData(paciente.STRING_PHOTO || paciente.STRING_FOTO || ''),
          // Añadir los campos de ubigeo y lugar de nacimiento
          COD_DISTRITO: paciente.COD_DISTRITO || '',
          LUGAR_NACIMIENTO: paciente.LUGAR_NACIMIENTO || ''
        };
        
        setPatientData(currentPatientId, patientInfo);
        return patientInfo;
      } catch (err: any) {
        console.error('Error al cargar datos del paciente:', err);
        setError(currentPatientId, err.message || 'Error al cargar datos del paciente');
        return null;
      } finally {
        setLoading(currentPatientId, false);
        // Remove the in-flight request when done
        delete inFlightRequests[currentPatientId];
      }
    })();
    
    // Store the promise
    inFlightRequests[currentPatientId] = fetchPromise;
    return fetchPromise;
  }, [getPatientData, setPatientData, setLoading, setError]); // Remove patientId from dependencies

  const refetchPatientData = React.useCallback(async () => {
    return fetchPatientData(true);
  }, [fetchPatientData]);

  return {
    fetchPatientData,
    refetchPatientData,
    isLoading: patientId ? isLoading[patientId] || false : false,
    error: patientId ? errors[patientId] || null : null
  };
};

// Helper function to process photo data
function processPhotoData(photoData: string): string {
  if (!photoData) return '';
  
  try {
    // Remove any whitespace, newlines or other non-base64 characters
    photoData = photoData.trim();
    
    // If it's already a data URL, keep it as is
    if (!photoData.startsWith('data:')) {
      // Check if it's a valid base64 string
      try {
        // Try to decode the first few characters to validate it's base64
        const testSample = photoData.substring(0, 10);
        atob(testSample);
        
        // If we got here, it's likely valid base64, so add the proper prefix
        photoData = `data:image/jpeg;base64,${photoData}`;
      } catch (e) {
        console.error('Invalid base64 data received:', e);
        return '';
      }
    } else {
      // Validate the data URL format
      if (!photoData.match(/^data:(image\/(jpeg|png|gif|webp|svg\+xml));base64,/)) {
        console.warn('Unusual data URL format:', photoData.substring(0, 30));
        // Try to fix common issues with data URLs
        if (photoData.includes('base64,')) {
          // Extract just the base64 part and reconstruct
          const base64Part = photoData.split('base64,')[1];
          if (base64Part) {
            photoData = `data:image/jpeg;base64,${base64Part}`;
          }
        }
      }
    }
    
    return photoData;
  } catch (error) {
    console.error('Error processing photo data:', error);
    return '';
  }
}
