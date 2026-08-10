import { useState, useEffect } from "react";
import { Medico } from "./useMedicos";
import { medicoServerService } from "@/services/master-tables/medicoService";

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
        const data = await medicoServerService.getMedicoById(id);
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
