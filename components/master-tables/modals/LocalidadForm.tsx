import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocalidades } from "@/hooks/master-tables/useLocalidades";

interface LocalidadFormProps {
  localidad?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const LocalidadForm: React.FC<LocalidadFormProps> = ({
  localidad,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { createLocalidad, updateLocalidad } = useLocalidades();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    LOCALIDAD: "",
    NOMBRE: "",
    UBIGEO: "",
    ACTIVO: "S",
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (localidad) {
      setFormData({
        LOCALIDAD: localidad.LOCALIDAD || "",
        NOMBRE: localidad.NOMBRE || "",
        UBIGEO: localidad.UBIGEO || "",
        ACTIVO: localidad.ACTIVO || "S",
      });
    }
  }, [localidad]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      
      if (localidad) {
        // Actualizar localidad existente
        result = await updateLocalidad(localidad.LOCALIDAD, formData);
      } else {
        // Crear nueva localidad
        result = await createLocalidad(formData);
      }

      if (result.success) {
        toast({
          title: localidad ? "Localidad actualizada" : "Localidad creada",
          description: localidad
            ? "La localidad ha sido actualizada correctamente"
            : "La localidad ha sido creada correctamente",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo guardar la localidad",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la localidad",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="LOCALIDAD">Código</Label>
        <Input
          id="LOCALIDAD"
          name="LOCALIDAD"
          value={formData.LOCALIDAD}
          onChange={handleChange}
          disabled={!!localidad} // Deshabilitar si estamos editando
          required
        />
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

      <div className="space-y-2">
        <Label htmlFor="UBIGEO">UBIGEO</Label>
        <Input
          id="UBIGEO"
          name="UBIGEO"
          value={formData.UBIGEO}
          onChange={handleChange}
          required
        />
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
          ) : localidad ? (
            "Actualizar"
          ) : (
            "Crear"
          )}
        </Button>
      </div>
    </form>
  );
};
