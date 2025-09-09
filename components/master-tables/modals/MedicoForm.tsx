import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
    DNI: "",
    EESS: "00000005947", // Fixed for HJATCH
    MEDICO: "", // Codigo
    NOMBRE: "", // Apellidos y Nombres
    ABREVIATURA: "MED", // MED or ENF
    COLEGIO: "", // Colegiatura
    COLESP: "", // Colegiatura de Especialidad
    ESPECIALIDAD: "", // Especialidad Actual
    CONSULTORIO: "", // Departamento/Servicio
    CODHIS: "", // Codigo HIS
    CONTRATO: "NINGUNO", // Condicion Laboral
    ACTIVO: "1", // Activo ("1") o no ("0")
    IMPCITA: "N" // Default value
  });

  // State for selectors
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [especialidadOpen, setEspecialidadOpen] = useState(false);
  const [consultorioOpen, setConsultorioOpen] = useState(false);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [loadingConsultorios, setLoadingConsultorios] = useState(false);

  // Load especialidades on component mount
  useEffect(() => {
    loadEspecialidades();
  }, []);

  // Load consultorios when especialidad changes
  useEffect(() => {
    if (formData.ESPECIALIDAD) {
      loadConsultorios(formData.ESPECIALIDAD);
    }
  }, [formData.ESPECIALIDAD]);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (medico) {
      setFormData({
        DNI: medico.DNI || "",
        EESS: medico.EESS || "00000005947",
        MEDICO: medico.MEDICO || "",
        NOMBRE: medico.NOMBRE || "",
        ABREVIATURA: medico.ABREVIATURA || "MED",
        COLEGIO: medico.COLEGIO || "",
        COLESP: medico.COLESP || "",
        ESPECIALIDAD: medico.ESPECIALIDAD || "",
        CONSULTORIO: medico.CONSULTORIO || "",
        CODHIS: medico.CODHIS || "",
        CONTRATO: medico.CONTRATO || "NINGUNO",
        ACTIVO: medico.ACTIVO || "1",
        IMPCITA: medico.IMPCITA || "N"
      });
    }
  }, [medico]);

  const loadEspecialidades = async () => {
    setLoadingEspecialidades(true);
    try {
      const response = await fetch('/api/especialidad');
      const result = await response.json();
      if (result.success) {
        setEspecialidades(result.data);
      }
    } catch (error) {
      console.error('Error loading especialidades:', error);
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  const loadConsultorios = async (especialidad: string) => {
    setLoadingConsultorios(true);
    try {
      const response = await fetch(`/api/consultorio/by-especialidad?especialidad=${especialidad}`);
      const result = await response.json();
      if (result.success) {
        setConsultorios(result.data);
      }
    } catch (error) {
      console.error('Error loading consultorios:', error);
    } finally {
      setLoadingConsultorios(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Validate DNI to only allow numbers
    if (name === 'DNI') {
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEspecialidadSelect = (especialidad: string) => {
    setFormData((prev) => ({ ...prev, ESPECIALIDAD: especialidad, CONSULTORIO: "" }));
    setEspecialidadOpen(false);
  };

  const handleConsultorioSelect = (consultorio: string) => {
    setFormData((prev) => ({ ...prev, CONSULTORIO: consultorio }));
    setConsultorioOpen(false);
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
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* DNI and Código */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="DNI">DNI *</Label>
          <Input
            id="DNI"
            name="DNI"
            value={formData.DNI}
            onChange={handleChange}
            placeholder="Solo números"
            maxLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="MEDICO">Código *</Label>
          <Input
            id="MEDICO"
            name="MEDICO"
            value={formData.MEDICO}
            onChange={handleChange}
            disabled={!!medico}
            maxLength={10}
            required
          />
        </div>
      </div>

      {/* EESS (Fixed) */}
      <div className="space-y-2">
        <Label htmlFor="EESS">Cod EESS (HJATCH)</Label>
        <Input
          id="EESS"
          name="EESS"
          value={formData.EESS}
          disabled
          className="bg-gray-100"
        />
      </div>

      {/* Apellidos y Nombres */}
      <div className="space-y-2">
        <Label htmlFor="NOMBRE">Apellidos y Nombres *</Label>
        <Input
          id="NOMBRE"
          name="NOMBRE"
          value={formData.NOMBRE}
          onChange={handleChange}
          placeholder="Ej: HOLGUIN CUCALON JORGE"
          maxLength={100}
          required
        />
      </div>

      {/* Abreviatura and Colegiatura */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ABREVIATURA">Abreviatura *</Label>
          <select
            id="ABREVIATURA"
            name="ABREVIATURA"
            value={formData.ABREVIATURA}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="MED">MED</option>
            <option value="ENF">ENF</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="COLEGIO">Colegiatura *</Label>
          <Input
            id="COLEGIO"
            name="COLEGIO"
            value={formData.COLEGIO}
            onChange={handleChange}
            placeholder="Ej: 15072"
            maxLength={20}
            required
          />
        </div>
      </div>

      {/* Colegiatura de Especialidad */}
      <div className="space-y-2">
        <Label htmlFor="COLESP">Colegiatura de Especialidad</Label>
        <Input
          id="COLESP"
          name="COLESP"
          value={formData.COLESP}
          onChange={handleChange}
          placeholder="Ej: 787878"
          maxLength={20}
        />
      </div>

      {/* Especialidad Actual Selector */}
      <div className="space-y-2">
        <Label>Especialidad Actual *</Label>
        <Popover open={especialidadOpen} onOpenChange={setEspecialidadOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={especialidadOpen}
              className="w-full justify-between"
              disabled={loadingEspecialidades}
            >
              {formData.ESPECIALIDAD
                ? especialidades.find((esp) => esp.Codigo === formData.ESPECIALIDAD)?.Nombre || formData.ESPECIALIDAD
                : "Seleccionar especialidad..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar especialidad..." />
              <CommandEmpty>No se encontró especialidad.</CommandEmpty>
              <CommandGroup>
                {especialidades.map((especialidad) => (
                  <CommandItem
                    key={especialidad.Codigo}
                    onSelect={() => handleEspecialidadSelect(especialidad.Codigo)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        formData.ESPECIALIDAD === especialidad.Codigo ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {especialidad.Codigo} - {especialidad.Nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Departamento/Servicio Selector */}
      <div className="space-y-2">
        <Label>Departamento/Servicio *</Label>
        <Popover open={consultorioOpen} onOpenChange={setConsultorioOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={consultorioOpen}
              className="w-full justify-between"
              disabled={loadingConsultorios || !formData.ESPECIALIDAD}
            >
              {formData.CONSULTORIO
                ? consultorios.find((cons) => cons.Consultorio === formData.CONSULTORIO)?.Nombre || formData.CONSULTORIO
                : "Seleccionar consultorio..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar consultorio..." />
              <CommandEmpty>No se encontró consultorio.</CommandEmpty>
              <CommandGroup>
                {consultorios.map((consultorio) => (
                  <CommandItem
                    key={consultorio.Consultorio}
                    onSelect={() => handleConsultorioSelect(consultorio.Consultorio)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        formData.CONSULTORIO === consultorio.Consultorio ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {consultorio.Consultorio} - {consultorio.Nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Codigo HIS */}
      <div className="space-y-2">
        <Label htmlFor="CODHIS">Código HIS</Label>
        <Input
          id="CODHIS"
          name="CODHIS"
          value={formData.CODHIS}
          onChange={handleChange}
          placeholder="Ej: 10976872001"
          maxLength={20}
        />
      </div>

      {/* Condicion Laboral */}
      <div className="space-y-2">
        <Label htmlFor="CONTRATO">Condición Laboral *</Label>
        <select
          id="CONTRATO"
          name="CONTRATO"
          value={formData.CONTRATO}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="NINGUNO">NINGUNO</option>
          <option value="CAS">CAS</option>
          <option value="NOMBRADO">NOMBRADO</option>
          <option value="TERCERO">TERCERO</option>
        </select>
      </div>

      {/* Estado Activo */}
      <div className="space-y-2">
        <Label>Estado *</Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={formData.ACTIVO === "1" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, ACTIVO: "1" }))}
            className={formData.ACTIVO === "1" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Activo
          </Button>
          <Button
            type="button"
            variant={formData.ACTIVO === "0" ? "default" : "outline"}
            onClick={() => setFormData(prev => ({ ...prev, ACTIVO: "0" }))}
            className={formData.ACTIVO === "0" ? "bg-red-600 hover:bg-red-700" : ""}
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
