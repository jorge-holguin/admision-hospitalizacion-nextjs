import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useConsultorios } from "@/hooks/master-tables/useConsultorios";

interface ConsultorioFormProps {
  consultorio?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConsultorioForm: React.FC<ConsultorioFormProps> = ({
  consultorio,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { createConsultorio, updateConsultorio } = useConsultorios();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    CONSULTORIO: "",
    CODIGOHIS: "",
    NOMBRE: "",
    ABREVIATURA: "",
    TIPO: "",
    NUMERO: "",
    ESPECIALIDAD: "",
    ACTIVO: "S",
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (consultorio) {
      setFormData({
        CONSULTORIO: consultorio.CONSULTORIO || "",
        CODIGOHIS: consultorio.CODIGOHIS || "",
        NOMBRE: consultorio.NOMBRE || "",
        ABREVIATURA: consultorio.ABREVIATURA || "",
        TIPO: consultorio.TIPO || "",
        NUMERO: consultorio.NUMERO || "",
        ESPECIALIDAD: consultorio.ESPECIALIDAD || "",
        ACTIVO: consultorio.ACTIVO || "S",
      });
    }
  }, [consultorio]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      
      if (consultorio) {
        // Actualizar consultorio existente
        result = await updateConsultorio(consultorio.CONSULTORIO, formData);
      } else {
        // Crear nuevo consultorio
        result = await createConsultorio(formData);
      }

      if (result.success) {
        toast({
          title: consultorio ? "Consultorio actualizado" : "Consultorio creado",
          description: consultorio
            ? "El consultorio ha sido actualizado correctamente"
            : "El consultorio ha sido creado correctamente",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo guardar el consultorio",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el consultorio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="CONSULTORIO">Código</Label>
          <Input
            id="CONSULTORIO"
            name="CONSULTORIO"
            value={formData.CONSULTORIO}
            onChange={handleChange}
            disabled={!!consultorio} // Deshabilitar si estamos editando
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="CODIGOHIS">Código HIS</Label>
          <Input
            id="CODIGOHIS"
            name="CODIGOHIS"
            value={formData.CODIGOHIS}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="NOMBRE">Nombre</Label>
        <Input
          id="NOMBRE"
          name="NOMBRE"
          value={formData.NOMBRE}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ABREVIATURA">Abreviatura</Label>
          <Input
            id="ABREVIATURA"
            name="ABREVIATURA"
            value={formData.ABREVIATURA}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="TIPO">Tipo</Label>
          <Input
            id="TIPO"
            name="TIPO"
            value={formData.TIPO}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="NUMERO">Número</Label>
          <Input
            id="NUMERO"
            name="NUMERO"
            value={formData.NUMERO}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ESPECIALIDAD">Especialidad</Label>
          <Input
            id="ESPECIALIDAD"
            name="ESPECIALIDAD"
            value={formData.ESPECIALIDAD}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ACTIVO">Estado</Label>
        <select
          id="ACTIVO"
          name="ACTIVO"
          value={formData.ACTIVO}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="S">Activo</option>
          <option value="N">Inactivo</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : consultorio ? (
            "Actualizar"
          ) : (
            "Crear"
          )}
        </Button>
      </div>
    </form>
  );
};
