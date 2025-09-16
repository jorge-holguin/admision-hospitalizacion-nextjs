import { useState } from "react";
import { Consultorio } from "./useConsultorios";

export function useOptimizedConsultorios() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener un consultorio por ID (solo cuando se necesita editar)
  const getConsultorioById = async (id: string): Promise<Consultorio | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/master-tables/consultorios/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`Error ${res.status} al obtener consultorio`);
      
      const data = await res.json();
      return data;
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
      const res = await fetch(`/api/master-tables/consultorios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultorioData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status} al crear consultorio`);
      }
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
      const res = await fetch(`/api/master-tables/consultorios/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultorioData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Error ${res.status} al actualizar consultorio`);
      }
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
