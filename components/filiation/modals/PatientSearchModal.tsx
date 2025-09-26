"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PatientSearchModalProps {
  onSearchComplete: (patientData: any) => void
  onCancel: () => void
}

export function PatientSearchModal({ onSearchComplete, onCancel }: PatientSearchModalProps) {
  const [documentType, setDocumentType] = useState("DNI")
  const [documentNumber, setDocumentNumber] = useState("")
  const [isLoadingReniec, setIsLoadingReniec] = useState(false)

  const handleSearchReniec = async () => {
    if (!documentNumber || documentNumber.length < 8) {
      alert("Ingrese un número de documento válido")
      return
    }

    setIsLoadingReniec(true)

    // Simulación de consulta a RENIEC
    setTimeout(() => {
      const mockReniecData = {
        dni: documentNumber,
        apellidoPaterno: "GARCIA",
        apellidoMaterno: "LOPEZ",
        nombres: "JUAN CARLOS",
        fechaNacimiento: "1985-03-15",
        sexo: "M",
        estadoCivil: "S",
        direccion: "AV. LIMA 123 - LIMA",
        distrito: "LIMA",
        provincia: "LIMA",
        departamento: "LIMA",
      }

      setIsLoadingReniec(false)
      onSearchComplete(mockReniecData)
    }, 2000)
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-blue-800">Buscar Paciente</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label htmlFor="documentType">Tipo de Documento</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DNI">DNI</SelectItem>
              <SelectItem value="CE">Carnet de Extranjería</SelectItem>
              <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="documentNumber">Número de Documento</Label>
          <Input
            id="documentNumber"
            placeholder="Ingrese número de documento..."
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            maxLength={documentType === "DNI" ? 8 : 12}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSearchReniec} 
            disabled={isLoadingReniec} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoadingReniec ? "Consultando..." : "Buscar"}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}
