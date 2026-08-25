import { useState, useEffect } from "react";
import { consultorioServerService } from "@/services/master-tables/consultorioService";

export interface Consultorio {
  CONSULTORIO: string;
  NOMBRE: string;
  ABREVIATURA?: string;
  ESPECIALIDAD?: string;
  TIPO?: string;
  ACTIVO: string;
  UPSTRAMA?: string;
  HIS_CODSERVICIO?: string;
  ORDEN?: string;
  ROL?: string;
  MUESTRAROL?: string;
  NUMERO?: string;
  [key: string]: any;
}

export function useConsultorioById(id: string | null) {
  const [consultorio, setConsultorio] = useState<Consultorio | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConsultorio = async () => {
      if (!id) {
        setConsultorio(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await consultorioServerService.getConsultorioById(id);
        setConsultorio(data);
      } catch (err) {
        console.error("Error fetching consultorio:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
        setConsultorio(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultorio();
  }, [id]);

  return { consultorio, isLoading, error };
}
