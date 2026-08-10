import { useState } from "react";
import { Medico } from "./useMedicos";
import { medicoServerService } from "@/services/master-tables/medicoService";

export function useOptimizedMedicos() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener un médico por ID (solo cuando se necesita editar)
  const getMedicoById = async (id: string): Promise<Medico | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await medicoServerService.getMedicoById(id);
      return data;
    } catch (err) {
      console.error("Error fetching médico:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para crear un médico
  const createMedico = async (medicoData: Partial<Medico>) => {
    setIsLoading(true);
    try {
      await medicoServerService.createMedico(medicoData);
      return { success: true };
    } catch (err) {
      console.error("Error creating médico:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : "Error desconocido" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar un médico
  const updateMedico = async (id: string, medicoData: Partial<Medico>) => {
    setIsLoading(true);
    try {
      await medicoServerService.updateMedico(id, medicoData);
      return { success: true };
    } catch (err) {
      console.error("Error updating médico:", err);
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
    getMedicoById,
    createMedico,
    updateMedico
  };
}
