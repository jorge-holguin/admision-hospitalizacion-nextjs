import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Calendar,
  Users
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
import { ProfesionColegioSelector } from "@/components/master-tables/selectors/ProfesionColegioSelector";

interface MedicoFormProps {
  medico?: any;
  onClose: () => void;
  onSuccess: () => void;
  onRefresh?: () => Promise<void>;
}

export const MedicoForm: React.FC<MedicoFormProps> = ({
  medico,
  onClose,
  onSuccess,
  onRefresh,
}) => {
  const { toast } = useToast();
  const { createMedico, updateMedico, isLoading: apiLoading } = useOptimizedMedicos();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    DNI: "",
    EESS: "00000005947",
    MEDICO: "",
    NOMBRE: "",
    ABREVIATURA: "MED",
    COLEGIO: "",
    COLESP: "",
    ESPECIALIDAD: "",
    CONSULTORIO: "",
    CODHIS: "",
    CONTRATO: "NINGUNO",
    ACTIVO: "1",
    IMPCITA: "N",
    PROFESION_COLEGIO: "",
    FECHNAC: "",
    GENERO: "",
    ESPECIALIDAD2: "0",
    CONSULTORIO2: "0",
    PROFESION_COLEGIO2: ""
  });

  // Catálogos / UI
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [especialidadOpen, setEspecialidadOpen] = useState(false);
  const [consultorioOpen, setConsultorioOpen] = useState(false);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [loadingConsultorios, setLoadingConsultorios] = useState(false);

  const [codigosSugeridos, setCodigosSugeridos] = useState<string[]>([]);
  const [loadingCodigos, setLoadingCodigos] = useState(false);

  // Segunda especialidad
  const [tieneSegundaEspecialidad, setTieneSegundaEspecialidad] = useState(false);
  const [consultorios2, setConsultorios2] = useState<any[]>([]);
  const [especialidad2Open, setEspecialidad2Open] = useState(false);
  const [consultorio2Open, setConsultorio2Open] = useState(false);
  const [loadingConsultorios2, setLoadingConsultorios2] = useState(false);

  // Mount: cargar especialidades
  useEffect(() => {
    void loadEspecialidades();
  }, []);

  // Cuando cambia especialidad principal, cargar consultorios
  useEffect(() => {
    if (formData.ESPECIALIDAD) {
      void loadConsultorios(formData.ESPECIALIDAD);
    } else {
      setConsultorios([]);
    }
  }, [formData.ESPECIALIDAD]);

  // Cuando cambia segunda especialidad, cargar consultorios2
  useEffect(() => {
    if (formData.ESPECIALIDAD2 && formData.ESPECIALIDAD2 !== "0") {
      void loadConsultorios2(formData.ESPECIALIDAD2);
    } else {
      setConsultorios2([]);
    }
  }, [formData.ESPECIALIDAD2]);

  // Sugerir códigos cuando cambia NOMBRE (solo en creación)
  useEffect(() => {
    if (formData.NOMBRE && formData.NOMBRE.trim().length > 0 && !medico) {
      const timeoutId = setTimeout(() => {
        void loadCodigosSugeridos(formData.NOMBRE);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setCodigosSugeridos([]);
    }
  }, [formData.NOMBRE, medico]);

  // Cargar datos en edición
  useEffect(() => {
    if (medico) {
      // Normalizar segundas opciones para evitar espacios en blanco
      const especialidad2 = (medico.ESPECIALIDAD2 || "0").trim();
      const consultorio2 = (medico.CONSULTORIO2 || "0").trim();

      // DD/MM/YYYY -> YYYY-MM-DD
      let fechaNacimiento = "";
      if (medico.FECHNAC && String(medico.FECHNAC).trim() !== "") {
        const fechaParts = String(medico.FECHNAC).split("/");
        if (fechaParts.length === 3) {
          fechaNacimiento = `${fechaParts[2]}-${fechaParts[1]}-${fechaParts[0]}`;
        } else {
          fechaNacimiento = medico.FECHNAC;
        }
      }

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
        PROFESION_COLEGIO: medico.PROFESION_COLEGIO || "",
        FECHNAC: fechaNacimiento,
        GENERO: medico.GENERO || "",
        ESPECIALIDAD2: especialidad2,
        CONSULTORIO2: consultorio2,
        PROFESION_COLEGIO2: medico.PROFESION_COLEGIO2 || ""
      });

      // Cargar consultorios para mostrar el nombre
      if (medico.ESPECIALIDAD) {
        void loadConsultorios(medico.ESPECIALIDAD);
      }

      if (especialidad2 && especialidad2 !== "0") {
        void loadConsultorios2(especialidad2);
      }
    }
  }, [medico]);

  // Detectar si checkbox debe estar desmarcado: si ESPECIALIDAD2 es 0 Y CONSULTORIO2 es 0 (con trim)
  useEffect(() => {
    if (medico) {
      const especialidad2 = (medico.ESPECIALIDAD2 || "0").trim();
      const consultorio2 = (medico.CONSULTORIO2 || "0").trim();
      const profesion2 = medico.PROFESION_COLEGIO2 ?? "";
      
      // Si ambos son "0" y no hay profesión, desmarcar el checkbox
      if (especialidad2 === "0" && consultorio2 === "0" && !profesion2) {
        setTieneSegundaEspecialidad(false);
      } else if (especialidad2 !== "0") {
        // Si hay especialidad2 válida, marcar el checkbox
        setTieneSegundaEspecialidad(true);
      }
    }
  }, [medico]);

  // Fetchers
  const loadEspecialidades = async () => {
    setLoadingEspecialidades(true);
    try {
      const response = await fetch("/api/master-tables/specialties");
      const result = await response.json();
      if (result.success) {
        setEspecialidades(result.data);
      }
    } catch (error) {
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
    } finally {
      setLoadingConsultorios(false);
    }
  };

  const loadConsultorios2 = async (especialidad: string) => {
    setLoadingConsultorios2(true);
    try {
      const response = await fetch(`/api/master-tables/consultorios/by-specialty?especialidad=${especialidad}`);
      const result = await response.json();
      if (result.success) {
        setConsultorios2(result.data);
      }
    } catch (error) {
    } finally {
      setLoadingConsultorios2(false);
    }
  };

  const loadCodigosSugeridos = async (nombreCompleto: string) => {
    setLoadingCodigos(true);
    try {
      const response = await fetch("/api/master-tables/medicos/suggest-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreCompleto }),
      });
      const result = await response.json();

      if (response.ok && result.candidatos) {
        setCodigosSugeridos(result.candidatos);
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

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "DNI") {
      const numericValue = value.replace(/\D/g, "");
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEspecialidadSelect = (especialidad: string) => {
    setFormData(prev => ({ ...prev, ESPECIALIDAD: especialidad, CONSULTORIO: "" }));
    setEspecialidadOpen(false);
  };

  const handleConsultorioSelect = (consultorio: string) => {
    setFormData(prev => ({ ...prev, CONSULTORIO: consultorio }));
    setConsultorioOpen(false);
  };

  const handleEspecialidad2Select = (especialidad: string) => {
    setFormData(prev => ({ ...prev, ESPECIALIDAD2: especialidad, CONSULTORIO2: "0" }));
    setEspecialidad2Open(false);
  };

  const handleConsultorio2Select = (consultorio: string) => {
    setFormData(prev => ({ ...prev, CONSULTORIO2: consultorio }));
    setConsultorio2Open(false);
  };

  const handleSegundaEspecialidadChange = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setTieneSegundaEspecialidad(isChecked);
    if (!isChecked) {
      setFormData(prev => ({ ...prev, ESPECIALIDAD2: "0", CONSULTORIO2: "0", PROFESION_COLEGIO2: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let result;
      if (medico) {
        result = await updateMedico(medico.MEDICO, formData);
      } else {
        result = await createMedico(formData);
      }

      if (result.success) {
        toast({
          title: medico ? "Médico actualizado" : "Médico creado",
          description: medico
            ? "El médico ha sido actualizado correctamente"
            : "El médico ha sido creado correctamente",
        });
        // Refresh para cargar los nuevos campos editados
        if (medico && onRefresh) {
          await onRefresh();
        }
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo guardar el médico",
          variant: "destructive",
        });
      }
    } catch (error) {
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
      {/* Información Personal */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <User className="mr-2 h-5 w-5" /> Información Personal
        </h3>

        <div className="space-y-2 mb-4">
          <Label htmlFor="EESS" className="flex items-center">
            <Building className="mr-2 h-4 w-4" /> Cod EESS (HJATCH)
          </Label>
          <Input id="EESS" name="EESS" value={formData.EESS} disabled className="bg-gray-100" />
        </div>

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

        <div className="grid grid-cols-2 gap-4">
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
              <Input id="MEDICO" name="MEDICO" value={formData.MEDICO} disabled className="bg-gray-100" />
            )}

            {!medico && codigosSugeridos.length === 0 && !loadingCodigos && formData.NOMBRE && (
              <p className="text-xs text-red-500">Ingrese apellidos y nombres para generar códigos sugeridos</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="FECHNAC" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" /> Fecha de Nacimiento <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="FECHNAC"
              name="FECHNAC"
              type="date"
              value={formData.FECHNAC}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="GENERO" className="flex items-center">
              <Users className="mr-2 h-4 w-4" /> Género <span className="text-red-500 ml-1">*</span>
            </Label>
            <select
              id="GENERO"
              name="GENERO"
              value={formData.GENERO}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
        </div>
      </div>

      {/* Información Profesional */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Award className="mr-2 h-5 w-5" /> Información Profesional
        </h3>

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

      {/* Especialidad y Área */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Stethoscope className="mr-2 h-5 w-5" /> Especialidad y Área
        </h3>

        {/* === Fila de 3 columnas (principal) === */}
        <div className="grid grid-cols-3 gap-4">
          {/* Especialidad principal */}
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
                    <span className="truncate">
                      {especialidades.find((esp) => esp.Codigo === formData.ESPECIALIDAD)?.Nombre || formData.ESPECIALIDAD}
                    </span>
                  ) : (
                    "Seleccionar especialidad..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" onWheel={(e) => e.stopPropagation()}>
                <Command>
                  <CommandInput placeholder="Buscar especialidad..." />
                  <CommandEmpty>No se encontró especialidad.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto overscroll-contain">
                    {especialidades.map((especialidad) => (
                      <CommandItem
                        key={especialidad.Codigo}
                        onSelect={() => handleEspecialidadSelect(especialidad.Codigo)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 flex-shrink-0",
                            formData.ESPECIALIDAD === especialidad.Codigo ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{especialidad.Codigo} - {especialidad.Nombre}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Consultorio principal */}
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
                    <span className="truncate">
                      {(
                        consultorios.find((cons) => cons.Consultorio === formData.CONSULTORIO)?.Nombre
                      ) ?? medico?.CONSULTORIO_NOMBRE ?? formData.CONSULTORIO}
                    </span>
                  ) : (
                    "Seleccionar consultorio..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" onWheel={(e) => e.stopPropagation()}>
                <Command>
                  <CommandInput placeholder="Buscar consultorio..." />
                  <CommandEmpty>No se encontró consultorio.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto overscroll-contain">
                    {consultorios.map((consultorio) => (
                      <CommandItem
                        key={consultorio.Consultorio}
                        onSelect={() => handleConsultorioSelect(consultorio.Consultorio)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 flex-shrink-0",
                            formData.CONSULTORIO === consultorio.Consultorio ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{consultorio.Consultorio} - {consultorio.Nombre}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Profesión principal (3ra columna) */}
          <div className="space-y-2">
            <Label className="flex items-center">Profesión</Label>
            <ProfesionColegioSelector
              value={formData.PROFESION_COLEGIO}
              onChange={(value) => setFormData(prev => ({ ...prev, PROFESION_COLEGIO: value }))}
              label=""
              required={false}
            />
          </div>
        </div>

        {/* Checkbox segunda especialidad */}
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="tieneSegundaEspecialidad"
            checked={tieneSegundaEspecialidad}
            onCheckedChange={handleSegundaEspecialidadChange}
          />
          <Label
            htmlFor="tieneSegundaEspecialidad"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Agregar segunda especialidad
          </Label>
        </div>

        {/* === Fila de 3 columnas (segunda especialidad) === */}
        {tieneSegundaEspecialidad && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {/* Segunda especialidad */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Award className="mr-2 h-4 w-4" /> Segunda Especialidad *
              </Label>
              <Popover open={especialidad2Open} onOpenChange={setEspecialidad2Open}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={especialidad2Open}
                    className="w-full justify-between"
                    disabled={loadingEspecialidades}
                  >
                    {loadingEspecialidades ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                      </>
                    ) : formData.ESPECIALIDAD2 && formData.ESPECIALIDAD2 !== "0" ? (
                      <span className="truncate">
                        {especialidades.find((esp) => esp.Codigo === formData.ESPECIALIDAD2)?.Nombre || formData.ESPECIALIDAD2}
                      </span>
                    ) : (
                      "Seleccionar especialidad..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" onWheel={(e) => e.stopPropagation()}>
                  <Command>
                    <CommandInput placeholder="Buscar especialidad..." />
                    <CommandEmpty>No se encontró especialidad.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto overscroll-contain">
                      {especialidades.map((especialidad) => (
                        <CommandItem
                          key={especialidad.Codigo}
                          onSelect={() => handleEspecialidad2Select(especialidad.Codigo)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 flex-shrink-0",
                              formData.ESPECIALIDAD2 === especialidad.Codigo ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{especialidad.Codigo} - {especialidad.Nombre}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Consultorio 2 */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Building className="mr-2 h-4 w-4" />Departamento/Servicio *
              </Label>
              <Popover open={consultorio2Open} onOpenChange={setConsultorio2Open}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={consultorio2Open}
                    className="w-full justify-between"
                    disabled={loadingConsultorios2 || !formData.ESPECIALIDAD2 || formData.ESPECIALIDAD2 === "0"}
                  >
                    {loadingConsultorios2 ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                      </>
                    ) : formData.CONSULTORIO2 && formData.CONSULTORIO2 !== "0" ? (
                      <span className="truncate">
                        {(
                          consultorios2.find((cons) => cons.Consultorio === formData.CONSULTORIO2)?.Nombre
                        ) ?? medico?.CONSULTORIO2_NOMBRE ?? formData.CONSULTORIO2}
                      </span>
                    ) : (
                      "Seleccionar consultorio..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" onWheel={(e) => e.stopPropagation()}>
                  <Command>
                    <CommandInput placeholder="Buscar consultorio..." />
                    <CommandEmpty>No se encontró consultorio.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto overscroll-contain">
                      {consultorios2.map((consultorio) => (
                        <CommandItem
                          key={consultorio.Consultorio}
                          onSelect={() => handleConsultorio2Select(consultorio.Consultorio)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 flex-shrink-0",
                              formData.CONSULTORIO2 === consultorio.Consultorio ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{consultorio.Consultorio} - {consultorio.Nombre}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Profesión 2 (3ra columna) */}
            <div className="space-y-2">
              <Label className="flex items-center">Profesión para 2da Especialidad</Label>
              <ProfesionColegioSelector
                value={formData.PROFESION_COLEGIO2}
                onChange={(value) => setFormData(prev => ({ ...prev, PROFESION_COLEGIO2: value }))}
                label=""
                required={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Información Laboral */}
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Briefcase className="mr-2 h-5 w-5" /> Información Laboral
        </h3>

        <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex items-center">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || apiLoading} className="flex items-center">
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
