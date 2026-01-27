"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, User, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PatientSearchModal as FiliationPatientSearchModal } from "@/components/filiation/modals/PatientSearchModal"
import { PatientRegistrationModal } from "@/components/filiation/modals/PatientRegistrationModal"
import { EstadoCivilProvider } from "@/contexts/filiation/EstadoCivilContext"
import { PaisProvider } from "@/contexts/filiation/PaisContext"
import { EtniaProvider } from "@/contexts/filiation/EtniaContext"
import { ReligionProvider } from "@/contexts/filiation/ReligionContext"
import { OcupacionProvider } from "@/contexts/filiation/OcupacionContext"
import { GradoInstruccionProvider } from "@/contexts/filiation/GradoInstruccionContext"

interface Patient {
  // Campos que vienen del servicio filiacion2Service
  HISTORIA: string
  PACIENTE?: string
  NOMBRES: string
  SEXO: string
  DOCUMENTO: string
  FECHA_NACIMIENTO: string
  DIRECCION: string
  DISTRITO: string
  Distrito_Dir?: string
  STRING_FOTO?: string | null
}

interface PatientSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onPatientSelect: (patient: Patient, searchType: 'document' | 'name') => void
  onPatientCreated?: () => void // Callback cuando se crea un nuevo paciente
}

export function PatientSearchModal({ isOpen, onClose, onPatientSelect, onPatientCreated }: PatientSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("documento")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Estados para el modal de filiación
  const [showFiliationSearch, setShowFiliationSearch] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [reniecData, setReniecData] = useState<any>(null)
  const [sisData, setSisData] = useState<any>(null)
  const [prefilledDocument, setPrefilledDocument] = useState("")
  
  // Función para formatear fechas en formato YYYY-MM-DD a DD/MM/YYYY
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    
    try {
      // Caso 1: Formato "1983-02-16 00:00:00.0" (YYYY-MM-DD HH:MM:SS.S)
      if (dateString.includes('-') && dateString.includes('00:00:00.0')) {
        const parts = dateString.split(' ')[0].split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
      }
      
      // Caso 2: Formato "16 00:00:00.0/02/1983" (DD HH:MM:SS.S/MM/YYYY)
      if (dateString.includes('00:00:00.0') && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          // Extraer el día del primer segmento
          const dayPart = parts[0].trim();
          const day = dayPart.split(' ')[0].trim().padStart(2, '0');
          const month = parts[1].trim().padStart(2, '0');
          const year = parts[2].trim();
          return `${day}/${month}/${year}`;
        }
      }
      
      // Caso 3: Fecha ya en formato DD/MM/YYYY
      if (dateString.includes('/') && !dateString.includes('00:00:00.0')) {
        return dateString;
      }
      
      // Caso 4: Formato YYYY-MM-DD
      if (dateString.includes('-') && !dateString.includes(' ')) {
        const [year, month, day] = dateString.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      }
      
      // Caso 5: Cualquier otro formato de fecha/hora
      if (dateString.includes(':') || dateString.includes('-')) {
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }
      
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }

  // Función para obtener foto del paciente
  const fetchPatientPhoto = async (pacienteId: string): Promise<string | null> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_CITAS_MASTER_URL || 'http://192.168.0.252:9011'
      const response = await fetch(`${apiUrl}/cita/paciente-foto/${pacienteId}`)
      if (response.ok) {
        const data = await response.json()
        return data.foto || data.STRING_FOTO || data.photo || null
      }
      return null
    } catch (error) {
      console.warn('Error fetching patient photo:', error)
      return null
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsLoading(true)
    setHasSearched(true)
    
    try {
      // Usar el endpoint interno de filiacion2
      const paramName = searchType === 'documento' ? 'documento' : 'nombres'
      const params = new URLSearchParams({
        page: '1',
        pageSize: '10',
        [paramName]: searchTerm.trim()
      })
      
      const response = await fetch(`/api/filiation/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        let patientsData = data.data || []
        
        // Si se busca por nombre, obtener fotos de los pacientes
        if (searchType === 'nombre' && patientsData.length > 0) {
          console.log('🖼️ Obteniendo fotos de pacientes...')
          // Obtener fotos en paralelo para todos los pacientes
          const patientsWithPhotos = await Promise.all(
            patientsData.map(async (patient: Patient) => {
              const pacienteId = patient.PACIENTE || patient.HISTORIA
              if (pacienteId) {
                const photo = await fetchPatientPhoto(pacienteId)
                return { ...patient, STRING_FOTO: photo }
              }
              return patient
            })
          )
          patientsData = patientsWithPhotos
          console.log('✅ Fotos obtenidas para', patientsData.filter((p: any) => p.STRING_FOTO).length, 'pacientes')
        }
        
        setPatients(patientsData)
      } else {
        setPatients([])
      }
    } catch (error) {
      console.error('Error searching patients:', error)
      setPatients([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const resetSearch = () => {
    setSearchTerm("")
    setPatients([])
    setHasSearched(false)
  }

  const handleCreateNewPatient = () => {
    // Si buscó por documento, precargar el número
    if (searchType === 'documento' && searchTerm.trim()) {
      setPrefilledDocument(searchTerm.trim())
    } else {
      setPrefilledDocument("")
    }
    setShowFiliationSearch(true)
  }

  const handleFiliationSearchComplete = (reniecData: any, sisData?: any) => {
    console.log('🔄 handleFiliationSearchComplete en PatientSearchModal (appointments):')
    console.log('   - reniecData recibido:', reniecData ? 'Sí' : 'No')
    console.log('   - sisData recibido:', sisData ? 'Sí' : 'No')
    if (sisData) {
      console.log('   - sisData.tipoSeguro:', sisData.tipoSeguro)
      console.log('   - sisData completo:', JSON.stringify(sisData, null, 2))
    }
    setReniecData(reniecData)
    setSisData(sisData || null)
    console.log('✅ Estados actualizados, abriendo modal de registro')
    setShowFiliationSearch(false)
    setShowRegistrationModal(true)
  }

  const handleFiliationPatientFound = (patientData: any) => {
    // Si encuentra el paciente en filiación, cerrar todo y refrescar
    setShowFiliationSearch(false)
    onPatientCreated?.() // Notificar que se debe refrescar la búsqueda
    onClose()
  }

  const handleRegistrationSuccess = async (newPatientDocument?: string) => {
    setShowRegistrationModal(false)
    setReniecData(null)
    
    // ✅ En lugar de cerrar, buscar al paciente recién creado
    const documentToSearch = newPatientDocument || prefilledDocument
    
    if (documentToSearch) {
      console.log('🔍 Buscando paciente recién creado:', documentToSearch)
      setSearchTerm(documentToSearch)
      setSearchType('documento')
      setPrefilledDocument("")
      setHasSearched(true)
      
      // ✅ Realizar búsqueda automática usando la misma API que handleSearch
      try {
        setIsLoading(true)
        const params = new URLSearchParams({
          page: '1',
          pageSize: '10',
          documento: documentToSearch.trim()
        })
        
        const response = await fetch(`/api/filiation/search?${params}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📦 Respuesta de búsqueda:', data)
          
          // La respuesta puede venir como { data: [...] } o { success: true, data: [...] }
          const patients = data.data || data
          
          if (Array.isArray(patients) && patients.length > 0) {
            console.log('✅ Paciente encontrado:', patients[0])
            setPatients(patients)
          } else {
            console.warn('⚠️ No se encontró el paciente recién creado')
            setPatients([])
          }
        } else {
          console.error('❌ Error en la respuesta de búsqueda')
          setPatients([])
        }
      } catch (error) {
        console.error('❌ Error buscando paciente recién creado:', error)
        setPatients([])
      } finally {
        setIsLoading(false)
      }
    } else {
      // Si no hay documento, cerrar como antes
      onPatientCreated?.()
      onClose()
    }
  }

  const handleCancelFiliation = () => {
    setShowFiliationSearch(false)
    setShowRegistrationModal(false)
    setReniecData(null)
    setPrefilledDocument("")
  }

  useEffect(() => {
    if (!isOpen) {
      // Clear all state when modal closes
      resetSearch()
      setSisData(null)
      setReniecData(null)
      setShowFiliationSearch(false)
      setShowRegistrationModal(false)
      setPrefilledDocument("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[80vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-blue-800 font-semibold">Asignar Paciente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Buscar Paciente</Label>
              {hasSearched && (
                <Button variant="outline" size="sm" onClick={resetSearch}>
                  Nueva búsqueda
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Apellidos y Nombre</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder={searchType === "nombre" ? "Ingrese apellidos y nombre..." : "Ingrese número de documento..."}
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              
              <Button 
                onClick={handleSearch}
                disabled={!searchTerm.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          {hasSearched && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Resultados de búsqueda ({patients.length} encontrados)
              </Label>

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="mx-auto h-12 w-12 mb-3 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mb-4">Buscando pacientes...</p>
                  <p className="text-sm text-gray-400">Por favor espere mientras se realiza la búsqueda</p>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="mb-4">No se encontraron pacientes con los criterios de búsqueda</p>
                  <Button
                    onClick={handleCreateNewPatient}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Nueva Historia Clínica
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Historia</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Sexo</TableHead>
                        <TableHead>Fecha Nac.</TableHead>
                        <TableHead>Dirección</TableHead>
                        <TableHead>Distrito</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {patients.map((patient, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{patient.HISTORIA}</TableCell>
                          <TableCell>{patient.NOMBRES}</TableCell>
                          <TableCell>
                            <Badge variant={patient.SEXO === 'M' ? 'default' : 'secondary'}>
                              {patient.SEXO}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(patient.FECHA_NACIMIENTO)}</TableCell>
                          <TableCell className="max-w-xs truncate">{patient.DIRECCION}</TableCell>
                          <TableCell>{patient.DISTRITO || patient.Distrito_Dir || '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => onPatientSelect(patient, searchType === 'documento' ? 'document' : 'name')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Asignar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de búsqueda de filiación (para seleccionar tipo de documento y buscar RENIEC) */}
      {showFiliationSearch && (
        <Dialog open={showFiliationSearch} onOpenChange={() => setShowFiliationSearch(false)}>
          <FiliationPatientSearchModal
            onSearchComplete={handleFiliationSearchComplete}
            onPatientFound={handleFiliationPatientFound}
            onCancel={handleCancelFiliation}
            prefilledDocument={prefilledDocument}
          />
        </Dialog>
      )}

      {/* Modal de registro de paciente */}
      {showRegistrationModal && (
        <Dialog open={showRegistrationModal} onOpenChange={() => setShowRegistrationModal(false)}>
          <EstadoCivilProvider>
            <PaisProvider>
              <EtniaProvider>
                <ReligionProvider>
                  <OcupacionProvider>
                    <GradoInstruccionProvider>
                      <PatientRegistrationModal
                        reniecData={reniecData}
                        sisData={sisData}
                        documentType="D"
                        documentNumber={prefilledDocument}
                        onCancel={handleCancelFiliation}
                        onSuccess={handleRegistrationSuccess}
                      />
                    </GradoInstruccionProvider>
                  </OcupacionProvider>
                </ReligionProvider>
              </EtniaProvider>
            </PaisProvider>
          </EstadoCivilProvider>
        </Dialog>
      )}
    </Dialog>
  )
}
