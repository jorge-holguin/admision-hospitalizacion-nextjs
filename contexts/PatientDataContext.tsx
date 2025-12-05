"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

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
  direccion: string;
  distrito: string;
  distritoDir: string;
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
  const { getPatientData, setPatientData, setLoading, setError, isLoading, errors } = usePatientData();
  
  // Use a ref to track the current patientId to avoid stale closures
  const patientIdRef = React.useRef(patientId);
  React.useEffect(() => {
    patientIdRef.current = patientId;
  }, [patientId]);

  const fetchPatientData = React.useCallback(async () => {
    const currentPatientId = patientIdRef.current;
    if (!currentPatientId) return null;
    
    // Check if we already have the data in context
    const existingData = getPatientData(currentPatientId);
    if (existingData) {
      return existingData;
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

        const response = await fetch(`/api/filiation/${currentPatientId}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos del paciente: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          const patientInfo: PatientData = {
            paciente: data.data.PACIENTE || currentPatientId,
            nombres: data.data.NOMBRES || '',
            nombre: data.data.NOMBRE || '',
            historia: data.data.HISTORIA || '',
            apellidoPaterno: data.data.PATERNO || '',
            apellidoMaterno: data.data.MATERNO || '',
            documento: data.data.DOCUMENTO || '',
            tipoDocumento: data.data.TIPO_DOCUMENTO || '',
            fechaNacimiento: data.data.FECHA_NACIMIENTO || '',
            FECHA_NACIMIENTO: data.data.FECHA_NACIMIENTO || '', // Mantener mayúsculas para compatibilidad
            edad: data.data.EDAD || '',
            EDAD: data.data.EDAD || '', // Mantener mayúsculas para compatibilidad
            sexo: data.data.SEXO || '',
            estadoCivil: data.data.ESTADO_CIVIL || '',
            direccion: data.data.DIRECCION || '',
            distrito: data.data.DISTRITO || '',
            distritoDir: data.data.Distrito_Dir || '',
            telefono1: data.data.TELEFONO1 || '',
            telefono2: data.data.TELEFONO2 || '',
            seguro: data.data.SEGURO || '',
            descSeguro: data.data.NOMBRE_SEGURO || '',
            religion: data.data.RELIGION || '',
            descreligion: data.data.DESRELIGION || '',
            localidad: data.data.LOCALIDAD || '',
            nombreLocalidad: data.data.Nombre_Localidad || '',
            nombreOcupacion: data.data.NOMBRE_OCUPACION || '',
            photo: processPhotoData(data.data.STRING_PHOTO || data.data.STRING_FOTO || ''),
            // Añadir los campos de ubigeo y lugar de nacimiento
            COD_DISTRITO: data.data.COD_DISTRITO || '',
            LUGAR_NACIMIENTO: data.data.LUGAR_NACIMIENTO || ''
          };
          
          setPatientData(currentPatientId, patientInfo);
          return patientInfo;
        } else {
          throw new Error(data.error || 'No se encontraron datos del paciente');
        }
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

  return {
    fetchPatientData,
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
