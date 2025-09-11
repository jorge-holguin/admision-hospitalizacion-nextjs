"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Patient {
  // Campos que vienen del servicio filiacion2Service
  HISTORIA: string
  NOMBRES: string
  SEXO: string
  DOCUMENTO: string
  FECHA_NACIMIENTO: string
  DIRECCION: string
  DISTRITO: string
  Distrito_Dir?: string
}

interface PatientSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onPatientSelect: (patient: Patient) => void
}

export function PatientSearchModal({ isOpen, onClose, onPatientSelect }: PatientSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("documento")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

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
      
      const response = await fetch(`/api/filiacion2?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Los datos ya vienen en el formato correcto desde el servicio filiacion2Service
        setPatients(data.data || [])
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

  useEffect(() => {
    if (!isOpen) {
      resetSearch()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-800 font-semibold">Asignar Paciente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Buscar Paciente</Label>
            
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
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Resultados de búsqueda ({patients.length} encontrados)
                </Label>
                {patients.length > 0 && (
                  <Button variant="outline" size="sm" onClick={resetSearch}>
                    Nueva búsqueda
                  </Button>
                )}
              </div>

              {patients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>No se encontraron pacientes con los criterios de búsqueda</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Historia</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Sexo</TableHead>
                        <TableHead>Documento</TableHead>
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
                          <TableCell>{patient.DOCUMENTO}</TableCell>
                          <TableCell>{patient.FECHA_NACIMIENTO}</TableCell>
                          <TableCell className="max-w-xs truncate">{patient.DIRECCION}</TableCell>
                          <TableCell>{patient.DISTRITO || patient.Distrito_Dir || '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => onPatientSelect(patient)}
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
    </Dialog>
  )
}
