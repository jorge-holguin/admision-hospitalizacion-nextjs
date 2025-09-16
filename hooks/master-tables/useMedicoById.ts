import { useState, useEffect } from "react";
import { Medico } from "./useMedicos";

export function useMedicoById(id: string | null) {
  const [medico, setMedico] = useState<Medico | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedico = async () => {
      if (!id) {
        setMedico(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/master-tables/medicos/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`Error ${res.status} al obtener médico`);
        
        const data = await res.json();
        setMedico(data);
      } catch (err) {
        console.error("Error fetching médico:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setMedico(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedico();
  }, [id]);

  return { medico, isLoading, error };
}
