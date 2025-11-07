import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Check, 
  ChevronsUpDown, 
  User, 
  Fingerprint, 
  Building, 
  BookOpen, 
  Stethoscope, 
  Award, 
  Briefcase, 
  Hash, 
  BadgeCheck,
  RefreshCw,
  UserCheck
} from "lucide-react";
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
import { useOptimizedMedicos } from "@/hooks/master-tables/useOptimizedMedicos";
import { useMedicoById } from "@/hooks/master-tables/useMedicoById";
import { ProfesionColegioSelector } from "@/components/master-tables/selectors/ProfesionColegioSelector";

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
  const { createMedico, updateMedico, isLoading: apiLoading } = useOptimizedMedicos();
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
    IMPCITA: "N", // Default value
    PROFESION_COLEGIO: "" // Profesión y Colegio
  });

  // State for selectors
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [especialidadOpen, setEspecialidadOpen] = useState(false);
  const [consultorioOpen, setConsultorioOpen] = useState(false);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [loadingConsultorios, setLoadingConsultorios] = useState(false);
  const [codigosSugeridos, setCodigosSugeridos] = useState<string[]>([]);
  const [loadingCodigos, setLoadingCodigos] = useState(false);

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

  // Load códigos sugeridos when nombre changes
  useEffect(() => {
    if (formData.NOMBRE && formData.NOMBRE.trim().length > 0 && !medico) {
      const timeoutId = setTimeout(() => {
        loadCodigosSugeridos(formData.NOMBRE);
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timeoutId);
    } else {
      setCodigosSugeridos([]);
    }
  }, [formData.NOMBRE, medico]);

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
        IMPCITA: medico.IMPCITA || "N",
        PROFESION_COLEGIO: medico.PROFESION_COLEGIO || ""
      });
    }
  }, [medico]);

  const loadEspecialidades = async () => {
    setLoadingEspecialidades(true);
    try {
      const response = await fetch('/api/master-tables/specialties');
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
      const response = await fetch(`/api/master-tables/consultorios/by-specialty?especialidad=${especialidad}`);
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

  const loadCodigosSugeridos = async (nombreCompleto: string) => {
    setLoadingCodigos(true);
    try {
      const response = await fetch('/api/master-tables/medicos/suggest-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombreCompleto }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.candidatos) {
        setCodigosSugeridos(result.candidatos);
        // Si hay códigos sugeridos, seleccionar el primero por defecto
        if (result.candidatos.length > 0 && !formData.MEDICO) {
          setFormData(prev => ({ ...prev, MEDICO: result.candidatos[0] }));
        }
      } else {
        setCodigosSugeridos([]);
        toast({
          title: "Sin códigos disponibles",
          description: "No se encontraron códigos disponibles para este nombre",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading códigos sugeridos:', error);
      setCodigosSugeridos([]);
      toast({
        title: "Error",
        description: "Error al obtener códigos sugeridos",
        variant: "destructive",
      });
    } finally {
      setLoadingCodigos(false);
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
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <UserCheck className="mr-2 h-5 w-5" /> Información Personal
        </h3>
        
        {/* EESS (Fixed) - Movido arriba */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="EESS" className="flex items-center">
            <Building className="mr-2 h-4 w-4" /> Cod EESS (HJATCH)
          </Label>
          <Input
            id="EESS"
            name="EESS"
            value={formData.EESS}
            disabled
            className="bg-gray-100"
          />
        </div>
        
        {/* Apellidos y Nombres */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="NOMBRE" className="flex items-center">
            <User className="mr-2 h-4 w-4" /> Apellidos y Nombres *
          </Label>
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

        {/* DNI, Código y Profesión - Ahora en 3 columnas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="DNI" className="flex items-center">
              <Fingerprint className="mr-2 h-4 w-4" /> DNI *
            </Label>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="MEDICO" className="flex items-center">
                <Hash className="mr-2 h-4 w-4" /> Código *
              </Label>
              {!medico && loadingCodigos && (
                <div className="flex items-center text-xs text-gray-500">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Generando códigos...
                </div>
              )}
            </div>
            {!medico ? (
              <select
                id="MEDICO"
                name="MEDICO"
                value={formData.MEDICO}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
                disabled={loadingCodigos || codigosSugeridos.length === 0}
              >
                <option value="">Seleccionar código...</option>
                {codigosSugeridos.map((codigo) => (
                  <option key={codigo} value={codigo}>
                    {codigo}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="MEDICO"
                name="MEDICO"
                value={formData.MEDICO}
                disabled
                className="bg-gray-100"
              />
            )}
            {!medico && codigosSugeridos.length === 0 && !loadingCodigos && formData.NOMBRE && (
              <p className="text-xs text-red-500">Ingrese apellidos y nombres para generar códigos sugeridos</p>
            )}
          </div>
          
          {/* Profesión y Colegio */}
          <div className="space-y-2">
            <ProfesionColegioSelector
              value={formData.PROFESION_COLEGIO}
              onChange={(value) => setFormData(prev => ({ ...prev, PROFESION_COLEGIO: value }))}
              label="Profesión"
              required={false}
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Award className="mr-2 h-5 w-5" /> Información Profesional
        </h3>
        
        {/* Abreviatura, Colegiatura y Colegiatura de Especialidad en 3 columnas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ABREVIATURA" className="flex items-center">
              <BadgeCheck className="mr-2 h-4 w-4" /> Abreviatura *
            </Label>
            <select
              id="ABREVIATURA"
              name="ABREVIATURA"
              value={formData.ABREVIATURA}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="MED">MED - Médico</option>
              <option value="ENF">ENF - Enfermero(a)</option>
              <option value="QF">QF - Químico Farmacéutico</option>
              <option value="LIC">LIC - Licenciado(a)</option>
              <option value="TEC">TEC - Técnico(a)</option>
              <option value="PSI">PSI - Psicólogo(a)</option>
              <option value="OBS">OBS - Obstetra</option>
              <option value="TMD">TMD - Técnico Médico</option>
              <option value="ODO">ODO - Odontólogo(a)</option>
              <option value="NUT">NUT - Nutricionista</option>
              <option value="TMP">TMP - Tecnólogo Médico</option>
              <option value="OSD">OSD - Obstetriz</option>
              <option value="ARU">ARU - Asistente de Rehabilitación</option>
              <option value="MRE">MRE - Médico Residente</option>
              <option value="TSP">TSP - Trabajador Social</option>
              <option value="BIO">BIO - Biólogo(a)</option>
              <option value="VET">VET - Veterinario(a)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="COLEGIO" className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4" /> Colegiatura *
            </Label>
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
          <div className="space-y-2">
            <Label htmlFor="COLESP" className="flex items-center">
              <Stethoscope className="mr-2 h-4 w-4" /> Col. Especialidad
            </Label>
            <Input
              id="COLESP"
              name="COLESP"
              value={formData.COLESP}
              onChange={handleChange}
              placeholder="Ej: 787878"
              maxLength={20}
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Stethoscope className="mr-2 h-5 w-5" /> Especialidad y Área
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Especialidad Actual Selector */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Award className="mr-2 h-4 w-4" /> Especialidad Actual *
            </Label>
            <Popover open={especialidadOpen} onOpenChange={setEspecialidadOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={especialidadOpen}
                  className="w-full justify-between"
                  disabled={loadingEspecialidades}
                >
                  {loadingEspecialidades ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                    </>
                  ) : formData.ESPECIALIDAD ? (
                    especialidades.find((esp) => esp.Codigo === formData.ESPECIALIDAD)?.Nombre || formData.ESPECIALIDAD
                  ) : (
                    "Seleccionar especialidad..."
                  )}
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
            <Label className="flex items-center">
              <Building className="mr-2 h-4 w-4" /> Departamento/Servicio *
            </Label>
            <Popover open={consultorioOpen} onOpenChange={setConsultorioOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={consultorioOpen}
                  className="w-full justify-between"
                  disabled={loadingConsultorios || !formData.ESPECIALIDAD}
                >
                  {loadingConsultorios ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                    </>
                  ) : formData.CONSULTORIO ? (
                    consultorios.find((cons) => cons.Consultorio === formData.CONSULTORIO)?.Nombre || formData.CONSULTORIO
                  ) : (
                    "Seleccionar consultorio..."
                  )}
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
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Briefcase className="mr-2 h-5 w-5" /> Información Laboral
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Codigo HIS */}
          <div className="space-y-2">
            <Label htmlFor="CODHIS" className="flex items-center">
              <Hash className="mr-2 h-4 w-4" /> Código HIS
            </Label>
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
            <Label htmlFor="CONTRATO" className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" /> Condición Laboral *
            </Label>
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
        </div>
        
        {/* Estado Activo */}
        <div className="space-y-2 mt-4">
          <Label className="flex items-center">
            <UserCheck className="mr-2 h-4 w-4" /> Estado *
          </Label>
          <div className="flex gap-4">
            <Button
              type="button"
              variant={formData.ACTIVO === "1" ? "default" : "outline"}
              onClick={() => setFormData(prev => ({ ...prev, ACTIVO: "1" }))}
              className="flex items-center"
            >
              <Check className="mr-2 h-4 w-4" /> Activo
            </Button>
            <Button
              type="button"
              variant={formData.ACTIVO === "0" ? "default" : "outline"}
              onClick={() => setFormData(prev => ({ ...prev, ACTIVO: "0" }))}
              className="flex items-center"
            >
              <User className="mr-2 h-4 w-4" /> Inactivo
            </Button>
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
          ) : medico ? (
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
