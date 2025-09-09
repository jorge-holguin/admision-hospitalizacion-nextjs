import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { useConsultorios } from "@/hooks/master-tables/useConsultorios";
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

  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [openEspecialidad, setOpenEspecialidad] = useState(false);
  const [openTipo, setOpenTipo] = useState(false);
  const [codigoExists, setCodigoExists] = useState(false);
  const [checkingCodigo, setCheckingCodigo] = useState(false);

  // Cargar especialidades y tipos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar especialidades
        const espResponse = await fetch('/api/especialidad');
        if (espResponse.ok) {
          const espData = await espResponse.json();
          // Asegurarse de que especialidades sea siempre un array
          setEspecialidades(Array.isArray(espData) ? espData : 
                           (espData.data && Array.isArray(espData.data) ? espData.data : []));
        }

        // Cargar tipos (Tabla T)
        const tipoResponse = await fetch('/api/tipo');
        if (tipoResponse.ok) {
          const tipoData = await tipoResponse.json();
          // Asegurarse de que tipos sea siempre un array
          setTipos(Array.isArray(tipoData) ? tipoData : []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (consultorio) {
      setFormData({
        CONSULTORIO: consultorio.CONSULTORIO || "",
        UPSTRAMA: consultorio.UPSTRAMA || "",
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
      const response = await fetch(`/api/consultorio/check-codigo?codigo=${codigo}`);
      if (response.ok) {
        const data = await response.json();
        setCodigoExists(data.exists);
      }
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
    
    // Validar código único
    if (!consultorio && codigoExists) {
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

  const getEspecialidadName = (codigo: string) => {
    const esp = especialidades.find(e => e.Codigo === codigo);
    return esp ? esp.Nombre : codigo;
  };

  const getTipoName = (codigo: string) => {
    const tipo = tipos.find(t => t.Codigo === codigo);
    return tipo ? tipo.Nombre : codigo;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="CONSULTORIO">Código *</Label>
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
          <Label htmlFor="UPSTRAMA">Código UPS</Label>
          <Input
            id="UPSTRAMA"
            name="UPSTRAMA"
            value={formData.UPSTRAMA}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="HIS_CODSERVICIO">Código HIS</Label>
        <Input
          id="HIS_CODSERVICIO"
          name="HIS_CODSERVICIO"
          value={formData.HIS_CODSERVICIO}
          onChange={handleChange}
        />
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ABREVIATURA">Abreviatura *</Label>
          <Input
            id="ABREVIATURA"
            name="ABREVIATURA"
            value={formData.ABREVIATURA}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Especialidad *</Label>
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
                      key={esp.Especialidad}
                      onSelect={() => handleEspecialidadSelect(esp)}
                    >
                      {esp.Especialidad} - {esp.Nombre}
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
          <Label>Tipo *</Label>
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
        <div className="space-y-2">
          <Label htmlFor="ORDEN">Orden</Label>
          <Input
            id="ORDEN"
            name="ORDEN"
            type="number"
            value={formData.ORDEN}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Programa Rol</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.ROL === "1" ? "default" : "outline"}
              onClick={() => setFormData(prev => ({ ...prev, ROL: "1" }))}
              className="flex-1"
            >
              Sí
            </Button>
            <Button
              type="button"
              variant={formData.ROL === "0" ? "default" : "outline"}
              onClick={() => setFormData(prev => ({ ...prev, ROL: "0" }))}
              className="flex-1"
            >
              No
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Muestra Rol</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.MUESTRAROL === "1" ? "default" : "outline"}
              onClick={() => setFormData(prev => ({ ...prev, MUESTRAROL: "1" }))}
              className="flex-1"
            >
              Sí
            </Button>
            <Button
              type="button"
              variant={formData.MUESTRAROL === "0" ? "default" : "outline"}
              onClick={() => setFormData(prev => ({ ...prev, MUESTRAROL: "0" }))}
              className="flex-1"
            >
              No
            </Button>
          </div>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="NUMERO">Número</Label>
        <Input
          id="NUMERO"
          name="NUMERO"
          value={formData.NUMERO}
          onChange={handleChange}
        />
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
