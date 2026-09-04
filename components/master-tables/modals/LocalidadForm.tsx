import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocalidades } from "@/hooks/master-tables/useLocalidades";
import { localidadServerService } from "@/services/master-tables/localidadService";

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
    ACTIVO: "1",
  });

  const [codigoExists, setCodigoExists] = useState(false);
  const [checkingCodigo, setCheckingCodigo] = useState(false);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (localidad) {
      setFormData({
        LOCALIDAD: localidad.LOCALIDAD || "",
        NOMBRE: localidad.NOMBRE || "",
        UBIGEO: localidad.UBIGEO || "",
        ACTIVO: localidad.ACTIVO || "1",
      });
    }
  }, [localidad]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Solo permitir números en UBIGEO
    if (name === 'UBIGEO' && value && !/^\d*$/.test(value)) {
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validar código único si es el campo LOCALIDAD
    if (name === 'LOCALIDAD' && value && !localidad) {
      checkCodigoUnique(value);
    }
  };

  const checkCodigoUnique = async (codigo: string) => {
    if (!codigo) return;

    setCheckingCodigo(true);
    try {
      const existing = await localidadServerService.getLocalidadById(codigo);
      setCodigoExists(!!existing);
    } catch (error) {
      console.error('Error checking codigo:', error);
      setCodigoExists(false);
    } finally {
      setCheckingCodigo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar código único
    if (!localidad && codigoExists) {
      toast({
        title: "Error",
        description: "El código ya existe. Por favor, ingrese un código único.",
        variant: "destructive",
      });
      return;
    }
    
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
    <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
      <div className="space-y-2">
        <Label htmlFor="LOCALIDAD">Código *</Label>
        <div className="relative">
          <Input
            id="LOCALIDAD"
            name="LOCALIDAD"
            value={formData.LOCALIDAD}
            onChange={handleChange}
            disabled={!!localidad}
            required
            className={codigoExists ? "border-red-500" : ""}
          />
          {checkingCodigo && (
            <div className="absolute right-2 top-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
        {codigoExists && (
          <p className="text-sm text-red-500">Este código ya existe</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="NOMBRE">Nombre *</Label>
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
          type="text"
          value={formData.UBIGEO}
          onChange={handleChange}
          placeholder="Solo números"
        />
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={formData.ACTIVO === "1" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, ACTIVO: "1" }))}
            className={`flex-1 ${formData.ACTIVO === "1" ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            Activo
          </Button>
          <Button
            type="button"
            variant={formData.ACTIVO === "0" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, ACTIVO: "0" }))}
            className={`flex-1 ${formData.ACTIVO === "0" ? "bg-red-600 hover:bg-red-700" : ""}`}
          >
            Inactivo
          </Button>
        </div>
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
