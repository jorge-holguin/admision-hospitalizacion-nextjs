"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Step4ConfirmationProps {
  formData: any
  documentType: string
  documentNumber: string
  reniecData?: any
}

export function Step4Confirmation({ 
  formData, 
  documentType, 
  documentNumber, 
  reniecData 
}: Step4ConfirmationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-blue-700">Confirmación de Datos - Resumen Completo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {/* Datos Básicos */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                1
              </div>
              Datos Básicos
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Tipo Documento:</strong> {documentType}
              </div>
              <div>
                <strong>N° Documento:</strong> {reniecData?.dni || documentNumber || "N/A"}
              </div>
              <div>
                <strong>Apellido Paterno:</strong> {formData.apellidoPaterno || "N/A"}
              </div>
              <div>
                <strong>Apellido Materno:</strong> {formData.apellidoMaterno || "N/A"}
              </div>
              <div>
                <strong>Nombres:</strong> {formData.nombres || "N/A"}
              </div>
              <div>
                <strong>Fecha Nacimiento:</strong> {formData.fechaNacimiento || "N/A"}
              </div>
              <div>
                <strong>Sexo:</strong>{" "}
                {formData.sexo === "M" ? "Masculino" : formData.sexo === "F" ? "Femenino" : "N/A"}
              </div>
              <div>
                <strong>Estado Civil:</strong> {formData.estadoCivil || "N/A"}
              </div>
              <div>
                <strong>País Nacimiento:</strong> {formData.paisNacimiento}
              </div>
              <div>
                <strong>Lugar Nacimiento:</strong> {formData.lugarNacimiento || "N/A"}
              </div>
              <div className="col-span-2">
                <strong>Dirección:</strong> {formData.direccion || "Por completar"}
              </div>
              <div className="col-span-2">
                <strong>Distrito Procedencia:</strong> {formData.distritoProcedencia || "Por completar"}
              </div>
            </div>
          </div>

          {/* Datos Adicionales */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                2
              </div>
              Datos Adicionales
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Tipo de Seguro:</strong> {formData.tipoSeguro || "Por seleccionar"}
              </div>
              <div>
                <strong>Grado Instrucción:</strong> {formData.gradoInstruccion || "Por seleccionar"}
              </div>
              <div>
                <strong>Ocupación:</strong> {formData.ocupacion || "Por seleccionar"}
              </div>
              <div>
                <strong>Religión:</strong> {formData.religion || "Por completar"}
              </div>
              <div>
                <strong>Etnia:</strong> {formData.etnia || "Por completar"}
              </div>
              <div>
                <strong>Centro Poblado:</strong> {formData.centroPoblado || "Por completar"}
              </div>
              <div>
                <strong>N° Hijos:</strong> {formData.hijos || "Por completar"}
              </div>
              <div>
                <strong>Teléfono 1:</strong> {formData.telefono1 || "Por completar"}
              </div>
              <div>
                <strong>Teléfono 2:</strong> {formData.telefono2 || "Opcional"}
              </div>
              <div className="col-span-2">
                <strong>Observaciones:</strong> {formData.observacion || "Por completar"}
              </div>
            </div>
          </div>

          {/* Datos Familiares */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
              <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm mr-2">
                3
              </div>
              Datos Familiares y Acompañante
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Padre:</strong> {formData.padre || "Por completar"}
              </div>
              <div>
                <strong>Madre:</strong> {formData.madre || "Por completar"}
              </div>
              <div>
                <strong>Cónyuge:</strong> {formData.conyuge || "Por completar"}
              </div>
              <div>
                <strong>Ocupación Familiar:</strong> {formData.ocupacionFamiliar || "Por seleccionar"}
              </div>
              <hr className="my-2 border-purple-200" />
              <div>
                <strong>Acompañante:</strong> {formData.nombreAcompanante || "Por completar"}
              </div>
              <div>
                <strong>Parentesco:</strong> {formData.parentesco || "Por seleccionar"}
              </div>
              <div>
                <strong>Ocupación Acompañante:</strong> {formData.ocupacionAcompanante || "Por seleccionar"}
              </div>
              <div>
                <strong>Dirección Acompañante:</strong> {formData.direccionAcompanante || "Por completar"}
              </div>
              <div>
                <strong>Teléfonos Acompañante:</strong>{" "}
                {formData.telefonoAcompanante1 || formData.telefonoAcompanante2
                  ? `${formData.telefonoAcompanante1} ${formData.telefonoAcompanante2}` 
                  : "Por completar"}
              </div>
            </div>
          </div>

          {/* Estado del Registro */}
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Estado del Registro</h4>
            <div className="space-y-1 text-sm text-yellow-700">
              <p>✓ Datos RENIEC obtenidos correctamente</p>
              <p>⏳ Faltan completar datos adicionales</p>
              <p>⏳ Datos familiares opcionales pendientes</p>
              <p className="font-medium mt-2">📋 Complete los campos requeridos antes de crear la historia clínica</p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-blue-100 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📝 Instrucciones</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Los campos marcados con (*) son obligatorios</li>
              <li>• Los datos familiares y de acompañante son opcionales</li>
              <li>• Puede regresar a pasos anteriores para completar información</li>
              <li>• La foto se obtendrá automáticamente de RENIEC</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
