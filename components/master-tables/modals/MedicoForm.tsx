import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useMedicos } from "@/hooks/master-tables/useMedicos";

interface MedicoFormProps {
  medico?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const MedicoForm: React.FC<MedicoFormProps> = ({
  medico,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { createMedico, updateMedico } = useMedicos();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    MEDICO: "",
    NOMBRE: "",
    NOMBRES: "",
    APELLIDOS: "",
    DOCUMENTO: "",
    ABREVIATURA: "",
    COLEGIO: "",
    ESPECIALIDAD: "",
    CONSULTORIO: "",
    ACTIVO: "S",
  });

  // Cargar datos si estamos editando
  useEffect(() => {
    if (medico) {
      setFormData({
        MEDICO: medico.MEDICO || "",
        NOMBRE: medico.NOMBRE || "",
        NOMBRES: medico.NOMBRES || "",
        APELLIDOS: medico.APELLIDOS || "",
        DOCUMENTO: medico.DOCUMENTO || "",
        ABREVIATURA: medico.ABREVIATURA || "",
        COLEGIO: medico.COLEGIO || "",
        ESPECIALIDAD: medico.ESPECIALIDAD || "",
        CONSULTORIO: medico.CONSULTORIO || "",
        ACTIVO: medico.ACTIVO || "S",
      });
    }
  }, [medico]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      
      if (medico) {
        // Actualizar médico existente
        result = await updateMedico(medico.MEDICO, formData);
      } else {
        // Crear nuevo médico
        result = await createMedico(formData);
      }

      if (result.success) {
        toast({
          title: medico ? "Médico actualizado" : "Médico creado",
          description: medico
            ? "El médico ha sido actualizado correctamente"
            : "El médico ha sido creado correctamente",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo guardar el médico",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el médico",
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
          <Label htmlFor="MEDICO">Código</Label>
          <Input
            id="MEDICO"
            name="MEDICO"
            value={formData.MEDICO}
            onChange={handleChange}
            disabled={!!medico} // Deshabilitar si estamos editando
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="DOCUMENTO">Documento</Label>
          <Input
            id="DOCUMENTO"
            name="DOCUMENTO"
            value={formData.DOCUMENTO}
            onChange={handleChange}
            maxLength={15}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="NOMBRES">Nombres</Label>
          <Input
            id="NOMBRES"
            name="NOMBRES"
            value={formData.NOMBRES}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="APELLIDOS">Apellidos</Label>
          <Input
            id="APELLIDOS"
            name="APELLIDOS"
            value={formData.APELLIDOS}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="NOMBRE">Nombre Completo</Label>
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
          <Label htmlFor="COLEGIO">Colegio</Label>
          <Input
            id="COLEGIO"
            name="COLEGIO"
            value={formData.COLEGIO}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="CONSULTORIO">Consultorio</Label>
          <Input
            id="CONSULTORIO"
            name="CONSULTORIO"
            value={formData.CONSULTORIO}
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
          ) : medico ? (
            "Actualizar"
          ) : (
            "Crear"
          )}
        </Button>
      </div>
    </form>
  );
};
