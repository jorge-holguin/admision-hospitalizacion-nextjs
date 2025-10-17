"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TipoDocumentoSelector } from "@/components/appointments/selectors"
import { useReniec } from "@/hooks/useReniec"
import { toast } from "@/components/ui/use-toast"
import { consultarSIS } from "@/services/sisService"

interface PatientSearchModalProps {
  onSearchComplete: (patientData: any, sisData?: any) => void
  onPatientFound: (patientData: any) => void
  onCancel: () => void
  prefilledDocument?: string // Documento precargado desde appointments
}

export function PatientSearchModal({ onSearchComplete, onPatientFound, onCancel, prefilledDocument }: PatientSearchModalProps) {
  const [documentType, setDocumentType] = useState("D") // D = DNI (valor por defecto)
  const [documentNumber, setDocumentNumber] = useState(prefilledDocument || "")
  const [isLoadingReniec, setIsLoadingReniec] = useState(false)
  const { consultarReniec } = useReniec()

  // Actualizar el número de documento cuando cambie el prop
  useEffect(() => {
    if (prefilledDocument) {
      setDocumentNumber(prefilledDocument)
    }
  }, [prefilledDocument])

  const handleSearchReniec = async () => {
    if (!documentNumber || documentNumber.length < 8) {
      toast({
        title: "Validación",
        description: "Ingrese un número de documento válido",
        variant: "destructive"
      })
      return
    }

    setIsLoadingReniec(true)

    try {
      // 1. Primero buscar en la API de filiación
      console.log(`🔍 Buscando paciente en BD local: ${documentNumber}`)
      const filiacionResponse = await fetch(
        `/api/filiation/search?page=1&pageSize=10&documento=${documentNumber}`
      );
      const filiacionData = await filiacionResponse.json();

      // 2. Si encuentra datos en filiación, mostrar ese registro
      if (filiacionData.data && filiacionData.data.length > 0) {
        console.log(`✅ Paciente encontrado en BD local`)
        setIsLoadingReniec(false);
        onPatientFound(filiacionData.data[0]);
        return;
      }

      console.log(`⚠️ Paciente no encontrado en BD local`)

      // 3. Consultar APIs externas según tipo de documento
      const isDNI = documentType.trim() === 'D'
      console.log(`📋 Tipo de documento: "${documentType}" (trimmed: "${documentType.trim()}"), Es DNI: ${isDNI}`)
      
      // Procesar resultados
      let hasData = false
      let reniecData = null
      let sisData = null

      // RENIEC: Solo para DNI de 8 dígitos
      if (isDNI && documentNumber.length === 8) {
        console.log(`🌐 Consultando RENIEC para DNI: ${documentNumber}`)
        const reniecResult = await consultarReniec(documentNumber)
        
        if (reniecResult.success && reniecResult.data) {
          console.log(`✅ Datos obtenidos de RENIEC`)
          reniecData = reniecResult.data
          hasData = true
        }
      }

      // SIS: Para TODOS los tipos de documento (DNI, CE, Pasaporte, etc.) con timeout de 2 segundos
      console.log(`🏥 Consultando SIS para documento: ${documentNumber}`)
      try {
        const sisResult: any = await Promise.race([
          consultarSIS(documentNumber),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SIS timeout')), 2000)
          )
        ])
        
        if (sisResult.success && sisResult.data) {
          console.log(`✅ Datos obtenidos del SIS`)
          console.log(`📋 Tipo de seguro SIS: ${sisResult.data.tipoSeguro} - ${sisResult.data.descTipoSeguro}`)
          console.log(`📦 Objeto sisData completo:`, sisResult.data)
          sisData = sisResult.data
          hasData = true
        } else {
          console.warn(`⚠️ SIS no retornó datos válidos:`, sisResult)
        }
      } catch (error: any) {
        console.warn(`⏱️ Timeout o error en consulta SIS (2s):`, error?.message || error)
      }

      // Mostrar resultados
      if (hasData) {
        const sources = []
        if (reniecData) sources.push('RENIEC')
        if (sisData) sources.push('SIS')
        
        // Mensaje especial si no tiene SIS activo
        if (reniecData && !sisData) {
          toast({
            title: "Datos encontrados en RENIEC",
            description: "⚠️ El paciente no cuenta con SIS activo. Complete el registro manualmente.",
            variant: "default",
          })
        } else {
          toast({
            title: "Datos encontrados",
            description: `Se encontraron datos en ${sources.join(' y ')}. Complete el registro.`,
          })
        }
        
        // Abrir modal de registro con datos disponibles
        console.log(`🚀 Pasando datos al modal de registro:`)
        console.log(`   - reniecData:`, reniecData ? 'Sí' : 'No')
        console.log(`   - sisData:`, sisData ? 'Sí' : 'No')
        if (sisData) {
          console.log(`   - sisData.tipoSeguro:`, sisData.tipoSeguro)
        }
        onSearchComplete(reniecData, sisData)
      } else {
        console.warn(`⚠️ No se encontraron datos en ${isDNI ? 'RENIEC ni ' : ''}SIS`)
        toast({
          title: "No encontrado",
          description: `⚠️ El paciente no cuenta con SIS activo. Puede registrar manualmente.`,
        })
        // Abrir modal de registro sin datos (llenado manual)
        onSearchComplete(null, null)
      }
    } catch (error) {
      console.error('❌ Error al buscar paciente:', error);
      toast({
        title: "Error",
        description: "Error al buscar paciente",
        variant: "destructive"
      })
    } finally {
      setIsLoadingReniec(false);
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
          <div className="w-[250px]">
            <Label htmlFor="documentType">Tipo de Documento</Label>
            <TipoDocumentoSelector
              value={documentType}
              onChange={setDocumentType}
              placeholder="Seleccione tipo"
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="documentNumber">Número de Documento</Label>
            <Input
              id="documentNumber"
              placeholder="Ingrese número de documento..."
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              maxLength={documentType.trim() === "D" ? 8 : 12}
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
