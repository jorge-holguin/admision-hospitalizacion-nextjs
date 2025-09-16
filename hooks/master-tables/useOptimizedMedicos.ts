import { useState } from "react";
import { Medico } from "./useMedicos";

export function useOptimizedMedicos() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener un médico por ID (solo cuando se necesita editar)
  const getMedicoById = async (id: string): Promise<Medico | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/master-tables/medicos/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`Error ${res.status} al obtener médico`);
      
      const data = await res.json();
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
      const res = await fetch(`/api/master-tables/medicos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicoData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status} al crear médico`);
      }
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
      const res = await fetch(`/api/master-tables/medicos/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicoData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status} al actualizar médico`);
      }
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
