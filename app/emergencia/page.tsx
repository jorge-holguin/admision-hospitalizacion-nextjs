"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, FileText, Calendar, AlertTriangle, Home, Shield, Archive, ArrowLeft, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Printer, RefreshCcw, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner" // Assuming sonner is available for toasts
import EmergencyRegisterForm from "./emergency-register-form"
import EmergencyPrintPreview from "./emergency-print-preview" // Import the new print preview component
import { Badge } from "@/components/ui/badge" // Import Badge component
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Import Tooltip components
import React from "react"

const menuItems = [
  { id: "historia", label: "Historia", icon: FileText },
  { id: "citas", label: "Citas", icon: Calendar },
  { id: "emergencia", label: "Emergencia", icon: AlertTriangle },
  { id: "hospitaliza", label: "Hospitaliza", icon: Home },
  { id: "seguros", label: "Seguros", icon: Shield },
  { id: "archivos", label: "Archivos", icon: Archive },
]

export default function AdmissionPage() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [filtro, setFiltro] = useState("")
  const [searchEmergencia, setSearchEmergencia] = useState("")
  const [showEmergencyForm, setShowEmergencyForm] = useState(false)
  const [selectedEmergencyRecord, setSelectedEmergencyRecord] = useState<any>(null)
  const [formMode, setFormMode] = useState<"new" | "edit" | "view">("new")
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [emergencyToCancel, setEmergencyToCancel] = useState<any>(null)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [emergenciaCurrentPage, setEmergenciaCurrentPage] = useState(1)
  const emergenciaItemsPerPage = 10

  const data = [
    {
      hc: "16168918",
      hc_ant: "002874",
      nombre: "VARONA BARRETO CHARO YOVANA",
      sexo: "F",
      nacimiento: "31/12/1973",
      direccion: "MZ E LT 14",
      dni: "16168918",
      localidad: "HORACIO ZEVALLOS",
      distritoActual: "ATE",
      distritoNacim: "CHICLA",
      bloqueo: "Falso",
    },
    {
      hc: "00906380",
      hc_ant: "",
      nombre: "VARONA BARRETO CHRISTOPHER JUNIOR",
      sexo: "M",
      nacimiento: "03/12/2001",
      direccion: "AV. TUPAC AMARU MZA-20, LOTE 2-A CMT 13",
      dni: "70801688",
      localidad: "SAN ANTONIO DE PEDREGAL",
      distritoActual: "LURIGANCHO",
      distritoNacim: "LURIGANCHO",
      bloqueo: "Falso",
    },
    {
      hc: "45002007",
      hc_ant: "0155442",
      nombre: "VARONA BARRETO DAISY PATRICIA",
      sexo: "F",
      nacimiento: "12/03/1986",
      direccion: "TUPAC AMARU MZA.20, LT. 2A CMT 13",
      dni: "45002007",
      localidad: "BOSQUE CONCORDIA (SAN AN)",
      distritoActual: "LURIGANCHO",
      distritoNacim: "LA OROYA",
      bloqueo: "Falso",
    },
    {
      hc: "06811422",
      hc_ant: "0187533",
      nombre: "VARONA BARRETO FERNANDO ADAN",
      sexo: "M",
      nacimiento: "17/05/1977",
      direccion: "MZ. 20, LTE. 2-A, AV. TUPAC AMARU",
      dni: "06811422",
      localidad: "SAN ANTONIO DE PEDREGAL",
      distritoActual: "LURIGANCHO",
      distritoNacim: "CHICLA",
      bloqueo: "Falso",
    },
    {
      hc: "00925925",
      hc_ant: "",
      nombre: "VARONA BARRETO JENNY INES",
      sexo: "F",
      nacimiento: "21/07/1971",
      direccion: "MZ. 20 LT. 2-A CMT 13",
      dni: "16134355",
      localidad: "SAN ANTONIO DE PEDREGAL",
      distritoActual: "LURIGANCHO",
      distritoNacim: "CHICLA",
      bloqueo: "Falso",
    },
    {
      hc: "40940547",
      hc_ant: "",
      nombre: "VARONA BARRETO JERRY ADAN",
      sexo: "M",
      nacimiento: "10/05/1980",
      direccion: "TUPAC AMARU MZ 20 LT 2-A CMT.13",
      dni: "40940547",
      localidad: "PEDREGAL BAJO",
      distritoActual: "LURIGANCHO",
      distritoNacim: "LURIGANCHO",
      bloqueo: "Falso",
    },
    {
      hc: "45003003",
      hc_ant: "0168205",
      nombre: "VARONA BARRETO ROCIO LUZ",
      sexo: "F",
      nacimiento: "06/03/1988",
      direccion: "AV. TUPAC AMARU MZ.20-LOTE 2- CTE.13",
      dni: "45003003",
      localidad: "SAN ANTONIO DE PEDREGAL",
      distritoActual: "LURIGANCHO",
      distritoNacim: "LIMA",
      bloqueo: "Falso",
    },
  ]

  const pacientesFiltrados = data.filter((paciente) =>
    Object.values(paciente).some((valor) => valor.toLowerCase().includes(filtro.toLowerCase())),
  )

  const [emergenciaRecords, setEmergenciaRecords] = useState([
    {
      estado: "3",
      emergencia: "25033385",
      fecha: "30/07/2025",
      hora: "14:18",
      orden: "103",
      paciente: "2008129935",
      historia: "29675613",
      nombres: "RODRIGUEZ TORRES DAFNEY JHONNY",
      sexo: "M",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Otros",
      usuario: "CPRADO",
      tipoAtencion: "E",
      fNacimiento: "01/01/1990", // Added for form
      apellidoPaterno: "RODRIGUEZ", // Added for form
      apellidoMaterno: "TORRES", // Added for form
      id: "12345", // Added for form
      edad: "35", // Added for form
      estadoCivil: "S [SOLTERO]", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "987654321", // Added for form
      telefono2: "", // Added for form
      domicilio: "Av. Siempre Viva 742", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Miraflores", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "29675613", // Added for form
      religion: "Católico", // Added for form
      acompanante: "Maria Torres", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "12345678", // Added for form
      observacion: "Paciente con dolor abdominal agudo.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS12345", // Added for form
      imprimirHoja: true, // Added for form
      atencionPorUrgencia: true, // Added for form
    },
    {
      estado: "3",
      emergencia: "25033386",
      fecha: "30/07/2025",
      hora: "12:31",
      orden: "095",
      paciente: "2008143601",
      historia: "93652715",
      nombres: "TRIGOS REUSCHE YASHELL CAMILA",
      sexo: "F",
      seguro: "SIS PEAS COMPLEMENTARIO",
      consultorio: "3050",
      nombreConsultorio: "PEDIATRIA EMERGENCIA",
      motivo: "Enfermedad Súbita",
      usuario: "JMOYA",
      tipoAtencion: "E",
      fNacimiento: "05/05/2000", // Added for form
      apellidoPaterno: "TRIGOS", // Added for form
      apellidoMaterno: "REUSCHE", // Added for form
      id: "67890", // Added for form
      edad: "25", // Added for form
      estadoCivil: "S [SOLTERO]", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "912345678", // Added for form
      telefono2: "", // Added for form
      domicilio: "Calle Falsa 123", // Added for form
      localidad: "Lima", // Added for form
      distrito: "San Isidro", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "93652715", // Added for form
      religion: "Cristiana", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Fiebre alta y malestar general.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS67890", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "4", // Estado 4, no se puede anular
      emergencia: "25033387",
      fecha: "30/07/2025",
      hora: "11:45",
      orden: "087",
      paciente: "2008156789",
      historia: "45123789",
      nombres: "GARCIA MENDOZA CARLOS ALBERTO",
      sexo: "M",
      seguro: "SIS PEAS COMPLETO",
      consultorio: "2050",
      nombreConsultorio: "CIRUGIA EMERGENCIA",
      motivo: "Accidente",
      usuario: "MLOPEZ",
      tipoAtencion: "E",
      fNacimiento: "10/10/1980", // Added for form
      apellidoPaterno: "GARCIA", // Added for form
      apellidoMaterno: "MENDOZA", // Added for form
      id: "11223", // Added for form
      edad: "45", // Added for form
      estadoCivil: "C [CASADO]", // Added for form
      formaIngreso: "3 [Camilla]", // Added for form
      telefono1: "998877665", // Added for form
      telefono2: "", // Added for form
      domicilio: "Av. Principal 456", // Added for form
      localidad: "Lima", // Added for form
      distrito: "La Molina", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "45123789", // Added for form
      religion: "Católico", // Added for form
      acompanante: "Ana Garcia", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "87654321", // Added for form
      observacion: "Fractura de tibia y peroné.", // Added for form
      condicionPaciente: "Crítico", // Added for form
      nroCuentaSis: "SIS11223", // Added for form
      imprimirHoja: true, // Added for form
      atencionPorUrgencia: true, // Added for form
    },
    {
      estado: "4", // Estado 4, no se puede anular
      emergencia: "25033388",
      fecha: "30/07/2025",
      hora: "10:20",
      orden: "072",
      paciente: "2008167890",
      historia: "78456123",
      nombres: "SILVA RAMIREZ MARIA ELENA",
      sexo: "F",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor Abdominal",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "02/02/1975", // Added for form
      apellidoPaterno: "SILVA", // Added for form
      apellidoMaterno: "RAMIREZ", // Added for form
      id: "44556", // Added for form
      edad: "50", // Added for form
      estadoCivil: "V [VIUDO]", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Pinos 789", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "78456123", // Added for form
      religion: "Evangélica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "3", // Estado 4, no se puede anular
      emergencia: "25033389",
      fecha: "30/07/2025",
      hora: "10:15",
      orden: "071",
      paciente: "2008167891",
      historia: "79684815",
      nombres: "PEREZ ESQUIVEL ADOLFO NORBERTO",
      sexo: "M",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor Abdominal",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "08/02/1990", // Added for form
      apellidoPaterno: "PEREZ", // Added for form
      apellidoMaterno: "ESQUIVEL", // Added for form
      id: "44556", // Added for form
      edad: "35", // Added for form
      estadoCivil: "S [SOLTERO", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Pinos 790", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "79684815", // Added for form
      religion: "Católica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "3", // Estado 4, no se puede anular
      emergencia: "25033390",
      fecha: "30/07/2025",
      hora: "10:10",
      orden: "070",
      paciente: "2008167891",
      historia: "65987142",
      nombres: "MENDOZA OLIVERA EDMUNDO RIGOBERTO",
      sexo: "M",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor en la parte media del abdomen",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "25/03/1993", // Added for form
      apellidoPaterno: "MENDOZA", // Added for form
      apellidoMaterno: "OLIVERA", // Added for form
      id: "44556", // Added for form
      edad: "32", // Added for form
      estadoCivil: "S [SOLTERO", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Cipreses 851", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "65987142", // Added for form
      religion: "Católica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "3", // Estado 4, no se puede anular
      emergencia: "25033390",
      fecha: "30/07/2025",
      hora: "10:00",
      orden: "069",
      paciente: "2008167892",
      historia: "48548952",
      nombres: "BUSTAMANTE RIVERA PATRICIO TEODORO",
      sexo: "M",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor en la parte media del abdomen",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "19/09/1973", // Added for form
      apellidoPaterno: "BUSTAMANTE", // Added for form
      apellidoMaterno: "RIVERA", // Added for form
      id: "44556", // Added for form
      edad: "41", // Added for form
      estadoCivil: "S [SOLTERO", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Sauces 919", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "48548952", // Added for form
      religion: "Católica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "4", // Estado 4, no se puede anular
      emergencia: "25033389",
      fecha: "30/07/2025",
      hora: "09:50",
      orden: "067",
      paciente: "2008167893",
      historia: "75684842",
      nombres: "PALACIOS ORTEGA XIMENA RAQUEL",
      sexo: "F",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor en la parte media del abdomen",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "25/06/1995", // Added for form
      apellidoPaterno: "PALACIOS", // Added for form
      apellidoMaterno: "ORTEGA", // Added for form
      id: "44556", // Added for form
      edad: "30", // Added for form
      estadoCivil: "S [SOLTERO", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Alamos 521", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "75684842", // Added for form
      religion: "Católica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "4", // Estado 4, no se puede anular
      emergencia: "25033388",
      fecha: "30/07/2025",
      hora: "09:40",
      orden: "066",
      paciente: "2008167894",
      historia: "79815463",
      nombres: "ESPINOZA TORRES OLIVIA MARISOL",
      sexo: "F",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor en la parte media del abdomen",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "24/03/2002", // Added for form
      apellidoPaterno: "ESPINOZA", // Added for form
      apellidoMaterno: "TORRES", // Added for form
      id: "44556", // Added for form
      edad: "23", // Added for form
      estadoCivil: "S [SOLTERO", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Eucaliptos 710", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "79815463", // Added for form
      religion: "Católica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "4", // Estado 4, no se puede anular
      emergencia: "25033387",
      fecha: "30/07/2025",
      hora: "09:30",
      orden: "065",
      paciente: "2008167895",
      historia: "79951123",
      nombres: "GUTIERREZ TORRENTE REBECA VALENTINA",
      sexo: "F",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor en la parte media del abdomen",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "24/03/2003", // Added for form
      apellidoPaterno: "GUTIERRES", // Added for form
      apellidoMaterno: "TORRENTE", // Added for form
      id: "44556", // Added for form
      edad: "22", // Added for form
      estadoCivil: "S [SOLTERO", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Pinos 911", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "79951123", // Added for form
      religion: "Católica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "4", // Estado 4, no se puede anular
      emergencia: "25033387",
      fecha: "30/07/2025",
      hora: "09:20",
      orden: "064",
      paciente: "2008167896",
      historia: "71223544",
      nombres: "CASANOVA MIRANDA MICHELLE JULIA",
      sexo: "F",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor en la parte media del abdomen",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "24/01/1990", // Added for form
      apellidoPaterno: "CASANOVA", // Added for form
      apellidoMaterno: "MIRANDA", // Added for form
      id: "44556", // Added for form
      edad: "35", // Added for form
      estadoCivil: "S [SOLTERO", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Andes 325", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "71223544", // Added for form
      religion: "Católica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
    {
      estado: "4", // Estado 4, no se puede anular
      emergencia: "25033387",
      fecha: "30/07/2025",
      hora: "09:10",
      orden: "063",
      paciente: "2008167896",
      historia: "75412145",
      nombres: "PACHECO RAMIREZ ALBERTO BERNARDO",
      sexo: "M",
      seguro: "SIS PEAS (DU046)",
      consultorio: "1050",
      nombreConsultorio: "MEDICINA EMERGENCIA",
      motivo: "Dolor en la parte media del abdomen",
      usuario: "ACASTRO",
      tipoAtencion: "E",
      fNacimiento: "20/09/2000", // Added for form
      apellidoPaterno: "PACHECO", // Added for form
      apellidoMaterno: "RAMIREZ", // Added for form
      id: "44556", // Added for form
      edad: "24", // Added for form
      estadoCivil: "S [SOLTERO", // Added for form
      formaIngreso: "1 [Caminando]", // Added for form
      telefono1: "976543210", // Added for form
      telefono2: "", // Added for form
      domicilio: "Jr. Los Nogales 768", // Added for form
      localidad: "Lima", // Added for form
      distrito: "Surco", // Added for form
      docIdentidad: "D [DNI]", // Added for form
      nroDoc: "75412145", // Added for form
      religion: "Católica", // Added for form
      acompanante: "", // Added for form
      docAcompanante: "D [DNI]", // Added for form
      nroDocAcompanante: "", // Added for form
      observacion: "Dolor abdominal persistente, se requiere evaluación.", // Added for form
      condicionPaciente: "Estable", // Added for form
      nroCuentaSis: "SIS44556", // Added for form
      imprimirHoja: false, // Added for form
      atencionPorUrgencia: false, // Added for form
    },
  ])

  const filteredEmergenciaData = emergenciaRecords.filter(
    (item) =>
      item.nombres.toLowerCase().includes(searchEmergencia.toLowerCase()) ||
      item.paciente.includes(searchEmergencia) ||
      item.historia.includes(searchEmergencia) ||
      item.orden.includes(searchEmergencia),
  )

  React.useEffect(() => {
    setEmergenciaCurrentPage(1)
  }, [searchEmergencia])

  const emergenciaTotalPages = Math.ceil(filteredEmergenciaData.length / emergenciaItemsPerPage)
  const paginatedEmergenciaData = filteredEmergenciaData.slice(
    (emergenciaCurrentPage - 1) * emergenciaItemsPerPage,
    emergenciaCurrentPage * emergenciaItemsPerPage,
  )

  const emergenciaActions = [
    {
      id: "new-sheet",
      icon: Plus,
      title: "Nueva Hoja de Emergencia",
      color: "text-green-600",
      onClick: () => {
        setSelectedEmergencyRecord(null)
        setFormMode("new")
        setShowEmergencyForm(true)
      },
    },
    { icon: RefreshCcw, title: "Actualizar", color: "text-indigo-600" },
    { icon: Download, title: "Exportar a Excel", color: "text-teal-600" },
  ]

  const emergenciaActionsAtencion = [
    {
      icon: Eye,
      title: "Ver Hoja de Emergencia",
      color: "text-blue-600",
      onClick: (item: any) => {
        setSelectedEmergencyRecord(item)
        setFormMode("view")
        setShowEmergencyForm(true)
      },
    },
    {
      icon: Edit,
      title: "Editar Hoja de Emergencia",
      color: "text-yellow-600",
      onClick: (item: any) => {
        setSelectedEmergencyRecord(item)
        setFormMode("edit")
        setShowEmergencyForm(true)
      },
    },
    {
      icon: Trash2,
      title: "Anular Hoja de Emergencia",
      color: "text-red-600",
      onClick: (item: any) => {
        if (item.estado === "4") {
          toast.info("No se puede anular la hoja de emergencia porque está atendida.", {
            duration: 3000,
            position: "top-center",
          })
        } else {
          setEmergencyToCancel(item)
          setShowCancelConfirmation(true)
        }
      },
    },
    {
      icon: Printer,
      title: "Imprimir Hoja de Emergencia",
      color: "text-purple-600",
      onClick: (item: any) => {
        setSelectedEmergencyRecord(item)
        setShowPrintPreview(true)
      },
    },
  ]

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(menuId)
    setShowEmergencyForm(false) // Hide form when switching tabs
    setSelectedEmergencyRecord(null) // Clear selected record
    setFormMode("new") // Reset form mode
    setShowPrintPreview(false) // Close print preview
  }

  const handleSaveEmergencyForm = (formData: any) => {
    // In a real application, you would send formData to your backend
    // and update the state with the new/updated record from the server.
    console.log("Emergency form saved/updated:", formData)
    setShowEmergencyForm(false)
    setSelectedEmergencyRecord(null)
    setFormMode("new")
    // For demonstration, if it's a new record, add it. If it's an edit, update it.
    if (formData.emergencia && emergenciaRecords.some((rec) => rec.emergencia === formData.emergencia)) {
      setEmergenciaRecords((prev) => prev.map((rec) => (rec.emergencia === formData.emergencia ? formData : rec)))
    } else {
      // Assign a dummy ID for new records if not provided by form
      const newId = `NEW${Math.floor(Math.random() * 1000000)}`
      setEmergenciaRecords((prev) => [...prev, { ...formData, emergencia: newId, estado: "3", tipoAtencion: "E" }])
    }
  }

  const handleCancelEmergencyForm = () => {
    setShowEmergencyForm(false)
    setSelectedEmergencyRecord(null)
    setFormMode("new")
  }

  const handleConfirmCancel = () => {
    if (emergencyToCancel) {
      // In a real application, you would send a request to annul the record
      console.log("Annulling emergency record:", emergencyToCancel)
      setEmergenciaRecords((prev) => prev.filter((rec) => rec.emergencia !== emergencyToCancel.emergencia))
      toast.success(`Hoja de emergencia ${emergencyToCancel.emergencia} anulada.`, {
        duration: 3000,
        position: "top-center",
      })
    }
    setShowCancelConfirmation(false)
    setEmergencyToCancel(null)
  }

  const GenderIcon = ({ gender }: { gender: string }) => {
    if (gender === "M") {
      return (
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 text-sm font-bold">♂</span>
        </div>
      )
    } else {
      return (
        <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
          <span className="text-pink-600 text-sm font-bold">♀</span>
        </div>
      )
    }
  }

  const renderContent = () => {
    if (!activeMenu) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center">
            <div className="w-64 h-64 mx-auto mb-8 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-32 h-32 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 14.1 11 13 11S11 10.1 11 9V7.5L5 7V9C5 10.1 4.1 11 3 11S1 10.1 1 9V7C1 6.4 1.4 6 2 6L10 6.5C10 5.1 10.9 4 12 4S14 5.1 14 6.5L22 6C22.6 6 23 6.4 23 7V9C23 10.1 22.1 11 21 11S19 10.1 19 9ZM12 13.5C14.8 13.5 17 15.7 17 18.5V22H7V18.5C7 15.7 9.2 13.5 12 13.5Z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido al Sistema de Admisión</h2>
            <p className="text-lg text-gray-600 mb-6">Seleccione una opción del menú lateral para comenzar</p>
            <div className="bg-blue-50 p-6 rounded-lg max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">SIGSALUD Admisión</h3>
              <p className="text-blue-700">
                Sistema integral para la gestión de admisiones hospitalarias, historias clínicas, citas médicas y más.
              </p>
            </div>
          </div>
        </div>
      )
    }

    switch (activeMenu) {
      case "historia":
        return (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Historias Clínicas</h2>
              <p className="text-gray-600">Gestión y búsqueda de historias clínicas de pacientes</p>
            </div>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                {/* Barra de búsqueda */}
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="relative max-w-md flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        placeholder="Buscar por nombre, DNI, HC..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="pl-10 h-12 text-base border-2 border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" title="Ver Historia" className="p-2 bg-transparent">
                        📄
                      </Button>
                      <Button variant="outline" size="sm" title="Nueva Historia" className="p-2 bg-transparent">
                        ➕
                      </Button>
                      <Button variant="outline" size="sm" title="Editar Historia" className="p-2 bg-transparent">
                        ✏️
                      </Button>
                      <Button variant="outline" size="sm" title="Eliminar Historia" className="p-2 bg-transparent">
                        🗑️
                      </Button>
                      <Button variant="outline" size="sm" title="Imprimir Historia" className="p-2 bg-transparent">
                        🖨️
                      </Button>
                      <Button variant="outline" size="sm" title="Actualizar Lista" className="p-2 bg-transparent">
                        🔄
                      </Button>
                      <Button variant="outline" size="sm" title="Exportar Datos" className="p-2 bg-transparent">
                        📤
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tabla de resultados */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-600 hover:bg-blue-600">
                        <TableHead className="font-semibold text-white">H.C.</TableHead>
                        <TableHead className="font-semibold text-white">HC_ANT</TableHead>
                        <TableHead className="font-semibold text-white">Apellidos y Nombres</TableHead>
                        <TableHead className="font-semibold text-white">Sexo</TableHead>
                        <TableHead className="font-semibold text-white">Fecha Nacimiento</TableHead>
                        <TableHead className="font-semibold text-white">Dirección</TableHead>
                        <TableHead className="font-semibold text-white">DNI</TableHead>
                        <TableHead className="font-semibold text-white">Localidad</TableHead>
                        <TableHead className="font-semibold text-white">Distrito Actual</TableHead>
                        <TableHead className="font-semibold text-white">Distrito Nacim</TableHead>
                        <TableHead className="font-semibold text-white">Bloqueo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pacientesFiltrados.map((paciente, index) => (
                        <TableRow
                          key={paciente.hc}
                          className={`
                          ${
                            index === pacientesFiltrados.length - 1
                              ? "bg-blue-50 hover:bg-blue-100"
                              : index % 2 === 0
                                ? "bg-white hover:bg-gray-50"
                                : "bg-gray-50 hover:bg-gray-100"
                          } transition-colors cursor-pointer
                        `}
                        >
                          <TableCell className="font-medium text-blue-800">{paciente.hc}</TableCell>
                          <TableCell>{paciente.hc_ant}</TableCell>
                          <TableCell className="font-medium">{paciente.nombre}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                paciente.sexo === "M" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                              }`}
                            >
                              {paciente.sexo}
                            </span>
                          </TableCell>
                          <TableCell>{paciente.nacimiento}</TableCell>
                          <TableCell className="max-w-xs truncate" title={paciente.direccion}>
                            {paciente.direccion}
                          </TableCell>
                          <TableCell>{paciente.dni}</TableCell>
                          <TableCell className="max-w-xs truncate" title={paciente.localidad}>
                            {paciente.localidad}
                          </TableCell>
                          <TableCell>{paciente.distritoActual}</TableCell>
                          <TableCell>{paciente.distritoNacim}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                paciente.bloqueo === "Falso" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {paciente.bloqueo}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mensaje cuando no hay resultados */}
                {pacientesFiltrados.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron historias clínicas con los criterios de búsqueda</p>
                  </div>
                )}

                {/* Información de resultados */}
                <div className="mt-4 text-sm text-gray-600">
                  Mostrando {pacientesFiltrados.length} de {data.length} historias clínicas
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "citas":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Citas Médicas</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Sistema para programar y gestionar citas médicas.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700">
                    <Calendar className="w-6 h-6 mb-2" />
                    Nueva Cita
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Calendar className="w-6 h-6 mb-2" />
                    Ver Agenda
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Calendar className="w-6 h-6 mb-2" />
                    Reprogramar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "emergencia":
        if (showEmergencyForm) {
          return (
            <EmergencyRegisterForm
              initialData={selectedEmergencyRecord}
              mode={formMode}
              onSave={handleSaveEmergencyForm}
              onCancel={handleCancelEmergencyForm}
            />
          )
        }
        return (
          <TooltipProvider>
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Emergencias</h2>
                <p className="text-gray-600">Atención y seguimiento de emergencias médicas</p>
              </div>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  {/* Barra de búsqueda y acciones */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    {/* Cuadro de búsqueda */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        placeholder="Buscar por paciente, historia, DNI, orden..."
                        value={searchEmergencia}
                        onChange={(e) => {
                          setSearchEmergencia(e.target.value)
                          setEmergenciaCurrentPage(1)
                        }}
                        className="w-full sm:w-96"
                        aria-label="Buscar registros de emergencia"
                      />
                      <Button variant="default" style={{ backgroundColor: "#0074ba" }}>
                        <Search className="w-4 h-4 mr-2" />
                        Buscar
                      </Button>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      {emergenciaActions.map((action, index) => {
                        const IconComponent = action.icon
                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                title={action.title}
                                className="text-blue-600 hover:bg-blue-50 border-blue-200 bg-transparent"
                                onClick={action.onClick}
                              >
                                <IconComponent className={`w-4 h-4 ${action.color}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{action.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tabla de emergencias */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="font-bold">Estado</TableHead>
                          <TableHead className="font-bold">Emergencia</TableHead>
                          <TableHead className="font-bold">Fecha</TableHead>
                          <TableHead className="font-bold">Hora</TableHead>
                          <TableHead className="font-bold">Orden</TableHead>
                          <TableHead className="font-bold">Paciente</TableHead>
                          <TableHead className="font-bold">Historia</TableHead>
                          <TableHead className="font-bold">Nombres</TableHead>
                          <TableHead className="font-bold">Sexo</TableHead>
                          <TableHead className="font-bold">Seguro</TableHead>
                          <TableHead className="font-bold">Consultorio</TableHead>
                          <TableHead className="font-bold">Nombre Consultorio</TableHead>
                          <TableHead className="font-bold">Motivo</TableHead>
                          <TableHead className="font-bold">Usuario</TableHead>
                          <TableHead className="font-bold">Tipo</TableHead>
                          <TableHead className="font-bold">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedEmergenciaData.length > 0 ? (
                          paginatedEmergenciaData.map((item, index) => (
                            <TableRow
                              key={item.emergencia}
                              className={`hover:bg-blue-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                            >
                              <TableCell className="font-medium">{item.estado}</TableCell>
                              <TableCell className="font-medium text-blue-600">{item.emergencia}</TableCell>
                              <TableCell className="font-medium">{item.fecha}</TableCell>
                              <TableCell className="font-medium">{item.hora}</TableCell>
                              <TableCell>
                                <Badge variant="default" className="bg-red-100 text-red-800">
                                  {item.orden}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">{item.paciente}</TableCell>
                              <TableCell className="text-blue-600 font-medium">{item.historia}</TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <GenderIcon gender={item.sexo} />
                                  <span>{item.nombres}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{item.sexo}</span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate" title={item.seguro}>
                                {item.seguro}
                              </TableCell>
                              <TableCell className="font-medium text-center">{item.consultorio}</TableCell>
                              <TableCell className="max-w-xs truncate font-medium" title={item.nombreConsultorio}>
                                {item.nombreConsultorio}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="default"
                                  className={
                                    item.motivo === "Otros"
                                      ? "bg-gray-100 text-gray-800"
                                      : item.motivo === "Enfermedad Súbita"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : item.motivo === "Accidente"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-orange-100 text-orange-800"
                                  }
                                >
                                  {item.motivo}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-gray-600">{item.usuario}</TableCell>
                              <TableCell>
                                <Badge variant="destructive" className="bg-red-600 text-white font-bold">
                                  {item.tipoAtencion}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {emergenciaActionsAtencion.map((action, actionIndex) => {
                                    const IconComponent = action.icon
                                    return (
                                      <Tooltip key={actionIndex}>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            title={action.title}
                                            className={`
                                              ${action.color} 
                                              hover:bg-blue-50 border-blue-200
                                              ${action.title === "Anular Hoja de Emergencia" ? "text-red-600 hover:bg-red-50 border-red-200" : ""}
                                            `}
                                            onClick={() => action.onClick(item)}
                                          >
                                            <IconComponent className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{action.title}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )
                                  })}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={16} className="text-center py-8 text-gray-500">
                              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No se encontraron registros de emergencia con los criterios de búsqueda</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {(emergenciaCurrentPage - 1) * emergenciaItemsPerPage + 1} a{" "}
                      {Math.min(emergenciaCurrentPage * emergenciaItemsPerPage, filteredEmergenciaData.length)} de{" "}
                      {filteredEmergenciaData.length} registros de emergencia
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEmergenciaCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={emergenciaCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: emergenciaTotalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={emergenciaCurrentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEmergenciaCurrentPage(page)}
                            style={emergenciaCurrentPage === page ? { backgroundColor: "#0074ba" } : {}}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEmergenciaCurrentPage((prev) => Math.min(prev + 1, emergenciaTotalPages))}
                        disabled={emergenciaCurrentPage === emergenciaTotalPages}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                        Emergencia Activa
                      </span>
                      <span className="text-gray-500">Última actualización: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Confirmation Dialog for Annulling */}
              <AlertDialog open={showCancelConfirmation} onOpenChange={setShowCancelConfirmation}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 text-2xl">⚠</span>
                      </div>
                    </div>
                    <AlertDialogTitle className="text-center">
                      ¿Está seguro de anular la hoja de emergencia?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                      Esta acción no se podrá deshacer
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex justify-center gap-4">
                    <AlertDialogCancel
                      style={{ backgroundColor: "#e91e63", color: "white" }}
                      className="hover:bg-pink-600"
                    >
                      No, cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmCancel}
                      style={{ backgroundColor: "#0074ba" }}
                      className="text-white hover:bg-blue-700"
                    >
                      Sí, aceptar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Print Preview Dialog */}
              <EmergencyPrintPreview
                isOpen={showPrintPreview}
                onClose={() => setShowPrintPreview(false)}
                data={selectedEmergencyRecord}
              />
            </div>
          </TooltipProvider>
        )
      case "hospitaliza":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Hospitalizaciones</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Sistema para gestionar ingresos y hospitalizaciones.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center bg-purple-600 hover:bg-purple-700">
                    <Home className="w-6 h-6 mb-2" />
                    Nuevo Ingreso
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Home className="w-6 h-6 mb-2" />
                    Pacientes Internados
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Home className="w-6 h-6 mb-2" />
                    Altas Médicas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "seguros":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Seguros</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Sistema para gestionar seguros médicos y coberturas.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center bg-indigo-600 hover:bg-indigo-700">
                    <Shield className="w-6 h-6 mb-2" />
                    Verificar Seguro
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Shield className="w-6 h-6 mb-2" />
                    Autorizaciones
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Shield className="w-6 h-6 mb-2" />
                    Facturación
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case "archivos":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Archivos</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Sistema para gestionar archivos y documentos médicos.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex flex-col items-center justify-center bg-orange-600 hover:bg-orange-700">
                    <Archive className="w-6 h-6 mb-2" />
                    Subir Archivo
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Archive className="w-6 h-6 mb-2" />
                    Buscar Documentos
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
                    <Archive className="w-6 h-6 mb-2" />
                    Archivo Digital
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header superior que abarca toda la página */}
      <header style={{ backgroundColor: "#0074ba" }} className="shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Lado izquierdo - Botón Volver y Logo */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
              onClick={() => (window.location.href = "/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Sistema Web de Admisión</h1>
              <p className="text-white text-sm opacity-90">
                {activeMenu ? menuItems.find((item) => item.id === activeMenu)?.label : "SIGSALUD Admisión"}
              </p>
            </div>
          </div>

          {/* Lado derecho - Información del usuario */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-white text-sm font-medium">ESTRADA CARDENAS DENISSE FIORELLA</p>
              <p className="text-white text-xs opacity-90">ANALISTA</p>
            </div>
            <User className="w-8 h-8 bg-blue-500 text-white rounded-full p-1" />
          </div>
        </div>
      </header>

      {/* Contenedor principal con sidebar y contenido */}
      <div className="flex flex-1">
        {/* Sidebar - Barra de menú izquierda con ancho fijo */}
        <div className="w-64 bg-white shadow-lg flex-shrink-0">
          {/* Menú de navegación */}
          <nav className="p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeMenu === item.id ? "default" : "ghost"}
                    className={`w-full justify-start h-12 ${
                      activeMenu === item.id
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleMenuClick(item.id)}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Área de contenido principal */}
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  )
}
