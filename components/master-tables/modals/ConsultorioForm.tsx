import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Search, 
  Hash, 
  Building, 
  FileText, 
  Award, 
  Tag, 
  ListOrdered, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  X,
  Stethoscope,
  Settings
} from "lucide-react";
import { useOptimizedConsultorios } from "@/hooks/master-tables/useOptimizedConsultorios";
import { useConsultorioById } from "@/hooks/master-tables/useConsultorioById";
import { getEspecialidades, type Especialidad } from "@/services/master-tables/especialidadService";
import { consultorioServerService } from "@/services/master-tables/consultorioService";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

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
  const { createConsultorio, updateConsultorio, isLoading: apiLoading } = useOptimizedConsultorios();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    CONSULTORIO: "",
    UPSTRAMA: "",
    HIS_CODSERVICIO: "",
    NOMBRE: "",
    ABREVIATURA: "",
    ESPECIALIDAD: "",
    TIPO: "",
    ORDEN: "",
    ROL: "0",
    MUESTRAROL: "0",
    ACTIVO: "1",
    NUMERO: "",
  });

  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [openEspecialidad, setOpenEspecialidad] = useState(false);
  const [openTipo, setOpenTipo] = useState(false);
  const [codigoExists, setCodigoExists] = useState(false);
  const [checkingCodigo, setCheckingCodigo] = useState(false);

  // Cargar especialidades y tipos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [especialidadesData, tiposData] = await Promise.all([
          getEspecialidades(),
          consultorioServerService.getConsultorioTipos(),
        ]);
        setEspecialidades(especialidadesData);
        setTipos(tiposData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Cargar datos si estamos editando - usando el ID directamente en lugar de pasar el objeto completo
  useEffect(() => {
    const loadConsultorioData = async () => {
      if (consultorio && consultorio.CONSULTORIO) {
        // Si ya tenemos todos los datos del consultorio, usarlos directamente
        setFormData({
          CONSULTORIO: consultorio.CONSULTORIO || "",
          UPSTRAMA: consultorio.upstrama || "",
          HIS_CODSERVICIO: consultorio.HIS_CODSERVICIO || "",
          NOMBRE: consultorio.NOMBRE || "",
          ABREVIATURA: consultorio.ABREVIATURA || "",
          ESPECIALIDAD: consultorio.ESPECIALIDAD || "",
          TIPO: consultorio.TIPO || "",
          ORDEN: consultorio.ORDEN || "",
          ROL: consultorio.ROL || "0",
          MUESTRAROL: consultorio.MUESTRAROL || "0",
          ACTIVO: consultorio.ACTIVO || "1",
          NUMERO: consultorio.NUMERO || "",
        });
      }
    };
    
    loadConsultorioData();
  }, [consultorio]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validar código único si es el campo CONSULTORIO
    if (name === 'CONSULTORIO' && value && !consultorio) {
      checkCodigoUnique(value);
    }
  };

  const checkCodigoUnique = async (codigo: string) => {
    if (!codigo) return;

    setCheckingCodigo(true);
    try {
      const result = await consultorioServerService.getConsultorioById(codigo);
      setCodigoExists(result !== null);
    } catch (error) {
      console.error('Error checking codigo:', error);
    } finally {
      setCheckingCodigo(false);
    }
  };

  const handleEspecialidadSelect = (especialidad: any) => {
    setFormData(prev => ({ ...prev, ESPECIALIDAD: especialidad.Codigo }));
    setOpenEspecialidad(false);
  };

  const handleTipoSelect = (tipo: any) => {
    setFormData(prev => ({ ...prev, TIPO: tipo.Codigo }));
    setOpenTipo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validaciones
      if (!formData.CONSULTORIO) {
        toast({
          title: "Error",
          description: "El código del consultorio es obligatorio",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!formData.NOMBRE) {
        toast({
          title: "Error",
          description: "El nombre del consultorio es obligatorio",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (codigoExists && !consultorio) {
        toast({
          title: "Error",
          description: "El código del consultorio ya existe",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Enviar datos usando los hooks optimizados
      const result = consultorio
        ? await updateConsultorio(consultorio.CONSULTORIO, formData)
        : await createConsultorio(formData);

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
          description: result.error || "Ha ocurrido un error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEspecialidadName = (codigo: string) => {
    const esp = especialidades.find(e => e.Codigo === codigo);
    return esp ? esp.Nombre : codigo;
  };

  const getTipoName = (codigo: string) => {
    const tipo = tipos.find(t => t.Codigo === codigo);
    return tipo ? tipo.Nombre : codigo;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Hash className="mr-2 h-5 w-5" /> Información Básica
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="CONSULTORIO" className="flex items-center">
              <Hash className="mr-2 h-4 w-4" /> Código *
            </Label>
            <div className="relative">
              <Input
                id="CONSULTORIO"
                name="CONSULTORIO"
                value={formData.CONSULTORIO}
                onChange={handleChange}
                disabled={!!consultorio}
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
            <Label htmlFor="UPSTRAMA" className="flex items-center">
              <Building className="mr-2 h-4 w-4" /> Código UPS
            </Label>
            <Input
              id="UPSTRAMA"
              name="UPSTRAMA"
              value={formData.UPSTRAMA}
              onChange={handleChange}
              placeholder="223900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="HIS_CODSERVICIO" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" /> Código HIS
            </Label>
            <Input
              id="HIS_CODSERVICIO"
              name="HIS_CODSERVICIO"
              value={formData.HIS_CODSERVICIO}
              onChange={handleChange}
              placeholder="303008"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="NOMBRE" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" /> Nombre *
            </Label>
            <Input
              id="NOMBRE"
              name="NOMBRE"
              value={formData.NOMBRE}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ABREVIATURA" className="flex items-center">
              <Tag className="mr-2 h-4 w-4" /> Abreviatura *
            </Label>
            <Input
              id="ABREVIATURA"
              name="ABREVIATURA"
              value={formData.ABREVIATURA}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Stethoscope className="mr-2 h-5 w-5" /> Configuración Médica
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label className="flex items-center">
              <Award className="mr-2 h-4 w-4" /> Especialidad *
            </Label>
            <Popover open={openEspecialidad} onOpenChange={setOpenEspecialidad}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openEspecialidad}
                  className="w-full justify-between"
                >
                  {formData.ESPECIALIDAD ? getEspecialidadName(formData.ESPECIALIDAD) : "Seleccionar especialidad..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar especialidad..." />
                  <CommandEmpty>No se encontraron especialidades.</CommandEmpty>
                  <CommandGroup>
                    {especialidades.map((esp) => (
                      <CommandItem
                        key={esp.Codigo}
                        onSelect={() => handleEspecialidadSelect(esp)}
                      >
                        {esp.Codigo} - {esp.Nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center">
              <Tag className="mr-2 h-4 w-4" /> Tipo *
            </Label>
            <Popover open={openTipo} onOpenChange={setOpenTipo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openTipo}
                  className="w-full justify-between"
                >
                  {formData.TIPO ? getTipoName(formData.TIPO) : "Seleccionar tipo..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar tipo..." />
                  <CommandEmpty>No se encontraron tipos.</CommandEmpty>
                  <CommandGroup>
                    {tipos.map((tipo) => (
                      <CommandItem
                        key={tipo.Codigo}
                        onSelect={() => handleTipoSelect(tipo)}
                      >
                        {tipo.Codigo} - {tipo.Nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ORDEN" className="flex items-center">
              <ListOrdered className="mr-2 h-4 w-4" /> Orden
            </Label>
            <Input
              id="ORDEN"
              name="ORDEN"
              type="number"
              value={formData.ORDEN}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="NUMERO" className="flex items-center">
              <Hash className="mr-2 h-4 w-4" /> Número
            </Label>
            <Input
              id="NUMERO"
              name="NUMERO"
              value={formData.NUMERO}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
  <h3 className="text-lg font-medium mb-3 flex items-center">
    <Settings className="mr-2 h-5 w-5" /> Configuración de Estado
  </h3>
  
  <div className="grid grid-cols-3 gap-4">
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        <div className="flex items-center">
          <ToggleLeft className="mr-2 h-4 w-4" /> Programa ROL
        </div>
        <ToggleSwitch 
          checked={formData.ROL === "1"} 
          onChange={(checked) => setFormData(prev => ({ ...prev, ROL: checked ? "1" : "0" }))}
        />
      </Label>
    </div>
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        <div className="flex items-center">
          <ToggleRight className="mr-2 h-4 w-4" /> Muestra ROL
        </div>
        <ToggleSwitch 
          checked={formData.MUESTRAROL === "1"} 
          onChange={(checked) => setFormData(prev => ({ ...prev, MUESTRAROL: checked ? "1" : "0" }))}
        />
      </Label>
    </div>
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        <div className="flex items-center">
          <Settings className="mr-2 h-4 w-4" /> Estado
        </div>
        <ToggleSwitch 
          checked={formData.ACTIVO === "1"} 
          onChange={(checked) => setFormData(prev => ({ ...prev, ACTIVO: checked ? "1" : "0" }))}
        />
      </Label>
    </div>
  </div>
</div>  

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex items-center">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="flex items-center">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : consultorio ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Actualizar
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" /> Crear
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
