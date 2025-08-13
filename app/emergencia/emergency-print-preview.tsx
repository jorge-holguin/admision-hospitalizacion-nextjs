"use client"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Printer, Download, X } from 'lucide-react'
// Se eliminó la importación de 'react-to-print'

interface EmergencyPrintPreviewProps {
  isOpen: boolean
  onClose: () => void
  data: any
}

export default function EmergencyPrintPreview({ isOpen, onClose, data }: EmergencyPrintPreviewProps) {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (componentRef.current) {
      const printContent = componentRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Imprimir</title>');
        // Copiar estilos del documento principal a la ventana de impresión para una apariencia consistente
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
          .map(node => node.outerHTML)
          .join('');
        printWindow.document.write(stylesheets);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        // Opcionalmente, cerrar la ventana después de imprimir, pero a menudo se deja abierta para que el usuario guarde como PDF
        // printWindow.close();
      }
    }
  };

  const handleDownloadPdf = () => {
    // Esto es un marcador de posición. En una aplicación real, usarías una librería
    // como html2pdf.js o enviarías los datos a un servidor para generar un PDF.
    alert("Funcionalidad de descarga de PDF no implementada en este ejemplo.")
    console.log("Attempting to download PDF for:", data)
  }

  if (!data) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl font-bold">Vista Previa de Hoja de Emergencia</DialogTitle>
          <div className="flex gap-2 mt-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleDownloadPdf} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button onClick={onClose} variant="outline" className="ml-auto bg-transparent">
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div ref={componentRef} className="bg-white p-8 shadow-md rounded-lg print:shadow-none print:p-0">
            <h2 className="text-2xl font-bold text-center mb-6 print:text-xl print:mb-4">HOJA DE EMERGENCIA</h2>

            <div className="grid grid-cols-2 gap-4 mb-4 print:grid-cols-2 print:gap-2 print:text-sm">
              <div>
                <p>
                  <span className="font-semibold">Fecha de Atención:</span> {data.fechaAtencion}
                </p>
                <p>
                  <span className="font-semibold">Hora:</span> {data.hora}
                </p>
                <p>
                  <span className="font-semibold">Orden:</span> {data.orden}
                </p>
              </div>
              <div className="text-right">
                <p>
                  <span className="font-semibold">ID:</span> {data.id}
                </p>
              </div>
            </div>

            <div className="border p-4 mb-4 bg-gray-100 print:border print:p-2 print:mb-2 print:bg-gray-50">
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Paciente:</span> {data.nombres}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">F. Nacimiento:</span> {data.fNacimiento}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Sexo:</span> {data.sexo}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">DNI:</span> {data.nroDoc}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Historia Clínica:</span> {data.historiaClinica}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Domicilio:</span> {data.domicilio}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Distrito:</span> {data.distrito}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Localidad:</span> {data.localidad}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Teléfono 1:</span> {data.telefono1}
                </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Teléfono 2:</span> {data.telefono2}
              </p>
            </div>

            <div className="border p-4 mb-4 bg-gray-100 print:border print:p-2 print:mb-2 print:bg-gray-50">
              <h3 className="font-bold text-lg mb-2 print:text-base print:mb-1">Detalle de la Atención</h3>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Consultorio/Servicio:</span> {data.consultorioServicio}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Motivo de Ingreso:</span> {data.motivoIngreso}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Observación:</span> {data.observacion}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Seguro del Paciente:</span> {data.seguroPaciente}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Condición del Paciente:</span> {data.condicionPaciente}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Nº de Cuenta (SIS):</span> {data.nroCuentaSis}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Imprimir Hoja:</span> {data.imprimirHoja ? "Sí" : "No"}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Atención por Urgencia:</span> {data.atencionPorUrgencia ? "Sí" : "No"}
              </p>
            </div>

            <div className="border p-4 bg-gray-100 print:border print:p-2 print:bg-gray-50">
              <h3 className="font-bold text-lg mb-2 print:text-base print:mb-1">Información Adicional</h3>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Acompañante:</span> {data.acompanante}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Doc. Acompañante:</span> {data.docAcompanante}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Nro. Doc. Acompañante:</span> {data.nroDocAcompanante}
              </p>
              <p className="mb-2 print:mb-1">
                <span className="font-semibold">Religión:</span> {data.religion}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
