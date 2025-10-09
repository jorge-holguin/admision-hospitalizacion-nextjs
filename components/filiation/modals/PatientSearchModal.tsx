"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PatientSearchModalProps {
  onSearchComplete: (patientData: any) => void
  onPatientFound: (patientData: any) => void
  onCancel: () => void
}

export function PatientSearchModal({ onSearchComplete, onPatientFound, onCancel }: PatientSearchModalProps) {
  const [documentType, setDocumentType] = useState("DNI")
  const [documentNumber, setDocumentNumber] = useState("")
  const [isLoadingReniec, setIsLoadingReniec] = useState(false)

  const handleSearchReniec = async () => {
    if (!documentNumber || documentNumber.length < 8) {
      alert("Ingrese un número de documento válido")
      return
    }

    setIsLoadingReniec(true)

    try {
      // 1. Primero buscar en la API de filiación
      const filiacionResponse = await fetch(
        `/api/filiacion2?page=1&pageSize=10&documento=${documentNumber}`
      );
      const filiacionData = await filiacionResponse.json();

      // 2. Si encuentra datos en filiación, redirigir a la página con ese registro
      if (filiacionData.data && filiacionData.data.length > 0) {
        setIsLoadingReniec(false);
        // Cerrar modal y mostrar en la tabla de filiación
        onPatientFound(filiacionData.data[0]);
        return;
      }

      // 3. Si no encuentra en filiación, consultar RENIEC (simulado)
      // Aquí iría la consulta real a RENIEC
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
        // Abrir modal de registro con datos de RENIEC
        onSearchComplete(mockReniecData)
      }, 1000)
    } catch (error) {
      console.error('Error al buscar paciente:', error);
      setIsLoadingReniec(false);
      alert('Error al buscar paciente');
    }
  }

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-blue-800">Buscar Paciente</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Campos en una sola línea horizontal */}
        <div className="flex items-end gap-3">
          <div className="w-[200px]">
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

          <div className="flex-1">
            <Label htmlFor="documentNumber">Número de Documento</Label>
            <Input
              id="documentNumber"
              placeholder="Ingrese número de documento..."
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              maxLength={documentType === "DNI" ? 8 : 12}
            />
          </div>

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
