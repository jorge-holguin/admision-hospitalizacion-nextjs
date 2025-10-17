"use client"

import { useState } from "react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ProtectedRoute from "@/components/ProtectedRoute"
import RoleBasedRoute from "@/components/RoleBasedRoute"

export default function MasterTablesPage() {
  const [activeTab, setActiveTab] = useState("medicos")
  
  // Estados para los diálogos de formularios
  const [medicoDialogOpen, setMedicoDialogOpen] = useState(false)
  const [consultorioDialogOpen, setConsultorioDialogOpen] = useState(false)
  const [localidadDialogOpen, setLocalidadDialogOpen] = useState(false)
  
  // Estados para los elementos seleccionados para editar
  const [selectedMedico, setSelectedMedico] = useState<any>(null)
  const [selectedConsultorio, setSelectedConsultorio] = useState<any>(null)
  const [selectedLocalidad, setSelectedLocalidad] = useState<any>(null)

  // Handlers para abrir formularios de creación - sin llamadas a la API
  const handleNewMedico = () => {
    // Simplemente establecemos el estado a null y abrimos el diálogo
    // No se hace ninguna llamada a la API aquí
    setSelectedMedico(null)
    setMedicoDialogOpen(true)
  }

  const handleNewConsultorio = () => {
    // Simplemente establecemos el estado a null y abrimos el diálogo
    // No se hace ninguna llamada a la API aquí
    setSelectedConsultorio(null)
    setConsultorioDialogOpen(true)
  }

  const handleNewLocalidad = () => {
    // Simplemente establecemos el estado a null y abrimos el diálogo
    // No se hace ninguna llamada a la API aquí
    setSelectedLocalidad(null)
    setLocalidadDialogOpen(true)
  }

  // Handlers para abrir formularios de edición - pasando solo el ID necesario
  const handleEditMedico = (medico: any) => {
    // Pasamos el objeto completo para evitar una llamada adicional a la API
    setSelectedMedico(medico)
    setMedicoDialogOpen(true)
  }

  const handleEditConsultorio = (consultorio: any) => {
    // Pasamos el objeto completo para evitar una llamada adicional a la API
    setSelectedConsultorio(consultorio)
    setConsultorioDialogOpen(true)
  }

  const handleEditLocalidad = (localidad: any) => {
    // Pasamos el objeto completo para evitar una llamada adicional a la API
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
        <Navbar title="Sistema de Integral de Admisión Hospitalaria" subtitle="TABLAS MAESTRAS" showBackButton={false} />
        <Toaster />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Administración de Tablas Maestras</h1>

          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white border-red-700"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Home className="h-10 w-10" />
            <span className="text-lg font-medium">Dashboard</span>
          </Button>
        </div>

        <Tabs defaultValue="medicos" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="medicos">Médicos</TabsTrigger>
            <TabsTrigger value="consultorios">Consultorios</TabsTrigger>
            <TabsTrigger value="localidades">Localidades</TabsTrigger>
          </TabsList>
          
          <TabsContent value="medicos" className="mt-6">
            <MedicosTable onEdit={handleEditMedico} onNew={handleNewMedico} />
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
      <Dialog open={medicoDialogOpen} onOpenChange={setMedicoDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMedico ? "Editar Médico" : "Nuevo Médico"}</DialogTitle>
          </DialogHeader>
          <MedicoForm 
            medico={selectedMedico} 
            onClose={handleMedicoDialogClose} 
            onSuccess={handleMedicoDialogClose} 
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo para Consultorios */}
      <Dialog open={consultorioDialogOpen} onOpenChange={setConsultorioDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedConsultorio ? "Editar Consultorio" : "Nuevo Consultorio"}</DialogTitle>
          </DialogHeader>
          <ConsultorioForm 
            consultorio={selectedConsultorio} 
            onClose={handleConsultorioDialogClose} 
            onSuccess={handleConsultorioDialogClose} 
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo para Localidades */}
      <Dialog open={localidadDialogOpen} onOpenChange={setLocalidadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedLocalidad ? "Editar Localidad" : "Nueva Localidad"}</DialogTitle>
          </DialogHeader>
          <LocalidadForm 
            localidad={selectedLocalidad} 
            onClose={handleLocalidadDialogClose} 
            onSuccess={handleLocalidadDialogClose} 
          />
        </DialogContent>
      </Dialog>
      </div>
      </RoleBasedRoute>
    </ProtectedRoute>
  )
}
