"use client"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { MedicosTable } from "@/components/master-tables/tables/MedicosTable"
import { ConsultoriosTable } from "@/components/master-tables/tables/ConsultoriosTable"
import { LocalidadesTable } from "@/components/master-tables/tables/LocalidadesTable"
import { MedicoForm } from "@/components/master-tables/modals/MedicoForm"
import { ConsultorioForm } from "@/components/master-tables/modals/ConsultorioForm"
import { LocalidadForm } from "@/components/master-tables/modals/LocalidadForm"
import { MasterTableModal } from "@/components/master-tables/modals/MasterTableModal"
import ProtectedRoute from "@/components/ProtectedRoute"
import RoleBasedRoute from "@/components/RoleBasedRoute"
import { usePermissions } from "@/contexts/PermissionsContext"
import { PERMISOS } from "@/lib/permissions"

export default function MasterTablesPage() {
  const { hasPermission } = usePermissions()
  const canCrearMedico       = hasPermission(PERMISOS.MEDICOS.CREAR)
  const canEditarMedico      = hasPermission(PERMISOS.MEDICOS.EDITAR)
  const canCrearConsultorio  = hasPermission(PERMISOS.CONSULTORIOS.CREAR)
  const canEditarConsultorio = hasPermission(PERMISOS.CONSULTORIOS.EDITAR)
  const canCrearLocalidad    = hasPermission(PERMISOS.LOCALIDADES.CREAR)
  const canEditarLocalidad   = hasPermission(PERMISOS.LOCALIDADES.EDITAR)

  const [activeTab, setActiveTab] = useState("medicos")
  
  // Estados para los diálogos de formularios
  const [medicoDialogOpen, setMedicoDialogOpen] = useState(false)
  const [consultorioDialogOpen, setConsultorioDialogOpen] = useState(false)
  const [localidadDialogOpen, setLocalidadDialogOpen] = useState(false)
  
  // Estados para los elementos seleccionados para editar
  const [selectedMedico, setSelectedMedico] = useState<any>(null)
  const [selectedConsultorio, setSelectedConsultorio] = useState<any>(null)
  const [selectedLocalidad, setSelectedLocalidad] = useState<any>(null)
  
  // Ref para el refresh de médicos
  const medicoRefreshRef = useRef<(() => void) | null>(null)

  // Handlers para abrir formularios de creación - sin llamadas a la API
  const handleNewMedico = () => {
    if (!canCrearMedico) return
    setSelectedMedico(null)
    setMedicoDialogOpen(true)
  }

  const handleNewConsultorio = () => {
    if (!canCrearConsultorio) return
    setSelectedConsultorio(null)
    setConsultorioDialogOpen(true)
  }

  const handleNewLocalidad = () => {
    if (!canCrearLocalidad) return
    setSelectedLocalidad(null)
    setLocalidadDialogOpen(true)
  }

  // Handlers para abrir formularios de edición - pasando solo el ID necesario
  const handleEditMedico = (medico: any) => {
    if (!canEditarMedico) return
    setSelectedMedico(medico)
    setMedicoDialogOpen(true)
  }

  const handleEditConsultorio = (consultorio: any) => {
    if (!canEditarConsultorio) return
    setSelectedConsultorio(consultorio)
    setConsultorioDialogOpen(true)
  }

  const handleEditLocalidad = (localidad: any) => {
    if (!canEditarLocalidad) return
    setSelectedLocalidad(localidad)
    setLocalidadDialogOpen(true)
  }

  // Handlers para cerrar diálogos
  const handleMedicoDialogClose = () => {
    setMedicoDialogOpen(false)
  }

  const handleConsultorioDialogClose = () => {
    setConsultorioDialogOpen(false)
  }

  const handleLocalidadDialogClose = () => {
    setLocalidadDialogOpen(false)
  }

  return (
    <ProtectedRoute>
      <RoleBasedRoute 
        allowedRoles={['DEVOPS' , 'ANALISTA', 'DESARROLLADOR', 'ESTADISTICA']}
        moduleName="Módulo de Tablas Maestras"
      >
        <div className="min-h-screen bg-gray-50">
        <Navbar title="Sistema de Admisión Web" subtitle="TABLAS MAESTRAS" showBackButton={false} />
        <Toaster />

      {/* Main Content */}
      <main className="page-shell py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold">Administración de Tablas Maestras</h1>

          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white border-red-700 w-full sm:w-auto"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Home className="h-10 w-10" />
            <span className="text-lg font-medium">Dashboard</span>
          </Button>
        </div>

        <Tabs defaultValue="medicos" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2">
            <TabsTrigger value="medicos">Médicos</TabsTrigger>
            <TabsTrigger value="consultorios">Consultorios</TabsTrigger>
            <TabsTrigger value="localidades">Localidades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="medicos" className="mt-6">
            <MedicosTable 
              onEdit={handleEditMedico} 
              onNew={handleNewMedico}
              refreshRef={medicoRefreshRef}
            />
          </TabsContent>
          
          <TabsContent value="consultorios" className="mt-6">
            <ConsultoriosTable onEdit={handleEditConsultorio} onNew={handleNewConsultorio} />
          </TabsContent>
          
          <TabsContent value="localidades" className="mt-6">
            <LocalidadesTable onEdit={handleEditLocalidad} onNew={handleNewLocalidad} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Diálogo para Médicos */}
      <MasterTableModal
        open={medicoDialogOpen}
        onOpenChange={setMedicoDialogOpen}
        title={selectedMedico ? "Editar Médico" : "Nuevo Médico"}
        size="lg"
      >
        <MedicoForm
          medico={selectedMedico}
          onClose={handleMedicoDialogClose}
          onSuccess={handleMedicoDialogClose}
          onRefresh={medicoRefreshRef.current ? async () => { medicoRefreshRef.current?.(); } : undefined}
        />
      </MasterTableModal>

      {/* Diálogo para Consultorios */}
      <MasterTableModal
        open={consultorioDialogOpen}
        onOpenChange={setConsultorioDialogOpen}
        title={selectedConsultorio ? "Editar Consultorio" : "Nuevo Consultorio"}
        size="md"
      >
        <ConsultorioForm
          consultorio={selectedConsultorio}
          onClose={handleConsultorioDialogClose}
          onSuccess={handleConsultorioDialogClose}
        />
      </MasterTableModal>

      {/* Diálogo para Localidades */}
      <MasterTableModal
        open={localidadDialogOpen}
        onOpenChange={setLocalidadDialogOpen}
        title={selectedLocalidad ? "Editar Localidad" : "Nueva Localidad"}
        size="sm"
      >
        <LocalidadForm
          localidad={selectedLocalidad}
          onClose={handleLocalidadDialogClose}
          onSuccess={handleLocalidadDialogClose}
        />
      </MasterTableModal>
      </div>
      </RoleBasedRoute>
    </ProtectedRoute>
  )
}
