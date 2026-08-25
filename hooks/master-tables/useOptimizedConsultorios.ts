import { useState } from "react";
import { Consultorio } from "./useConsultorios";
import { consultorioServerService } from "@/services/master-tables/consultorioService";

export function useOptimizedConsultorios() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener un consultorio por ID (solo cuando se necesita editar)
  const getConsultorioById = async (id: string): Promise<Consultorio | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await consultorioServerService.getConsultorioById(id);
    } catch (err) {
      console.error("Error fetching consultorio:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para crear un consultorio
  const createConsultorio = async (consultorioData: Partial<Consultorio>) => {
    setIsLoading(true);
    try {
      await consultorioServerService.createConsultorio(consultorioData);
      return { success: true };
    } catch (err) {
      console.error("Error creating consultorio:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Error desconocido" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar un consultorio
  const updateConsultorio = async (id: string, consultorioData: Partial<Consultorio>) => {
    setIsLoading(true);
    try {
      await consultorioServerService.updateConsultorio(id, consultorioData);
      return { success: true };
    } catch (err) {
      console.error("Error updating consultorio:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Error desconocido" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    getConsultorioById,
    createConsultorio,
    updateConsultorio
  };
}
