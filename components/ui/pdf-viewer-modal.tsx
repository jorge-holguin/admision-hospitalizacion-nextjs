"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Download, Printer, ArrowLeft, FileText } from "lucide-react"
import { mergePDFs, downloadMergedPDF, printMergedPDF } from '@/utils/pdfUtils'
import { useRouter } from 'next/navigation'

interface PDFViewerModalProps {
  open: boolean
  onClose: () => void
  pdfUrls: string[]
  title: string
  patientId?: string // ID del paciente para el botón "Ir a Órdenes"
}

export function PDFViewerModal({ open, onClose, pdfUrls, title, patientId }: PDFViewerModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pdfData, setPdfData] = useState<string[]>([])

  useEffect(() => {
    if (open && pdfUrls.length > 0) {
      setLoading(true)
      setPdfData([])
      
      // Fetch all PDFs and convert them to base64 data URLs
      const fetchPdfs = async () => {
        try {
          const pdfDataPromises = pdfUrls.map(async (url) => {
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`Error fetching PDF: ${response.status}`)
            }
            const blob = await response.blob()
            return URL.createObjectURL(blob)
          })
          
          const results = await Promise.all(pdfDataPromises)
          setPdfData(results)
          setLoading(false)
          
          // Esperar a que se carguen los PDFs y luego preparar para imprimir automáticamente
          setTimeout(async () => {
            try {
              console.log('Preparando impresión automática de documento combinado')
              await printMergedPDF(results)
            } catch (error) {
              console.error('Error en impresión automática:', error)
            }
          }, 2000)
        } catch (error) {
          console.error('Error loading PDFs:', error)
          setLoading(false)
        }
      }
      
      fetchPdfs()
    }
  }, [open, pdfUrls])

  // Función para imprimir todos los PDFs como un solo documento
  const handlePrint = async () => {
    try {
      console.log('Preparando impresión de documento combinado');
      setLoading(true);
      await printMergedPDF(pdfData);
      setLoading(false);
    } catch (error) {
      console.error('Error al imprimir documento combinado:', error);
      setLoading(false);
    }
  }

  // Función para descargar todos los PDFs como un solo documento
  const handleDownload = async () => {
    try {
      console.log('Preparando descarga de documento combinado');
      setLoading(true);
      await downloadMergedPDF(pdfData, 'documentos-hospitalizacion.pdf');
      setLoading(false);
    } catch (error) {
      console.error('Error al descargar documento combinado:', error);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center space-x-2 text-sm font-normal">
              {pdfData.length > 0 && (
                <span className="text-gray-600">
                  {pdfData.length} documento(s)
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 bg-gray-100 rounded-md overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="lg" />
              <span className="ml-2">Cargando documentos...</span>
            </div>
          ) : pdfData.length > 0 ? (
            <div className="w-full h-full overflow-y-auto">
              {pdfData.map((pdfUrl, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <iframe 
                    src={pdfUrl} 
                    className="w-full h-[500px] border-0"
                    title={`PDF Viewer ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-red-500">Error al cargar los documentos</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center pt-4">
          <div></div> {/* Espacio vacío para mantener la alineación */}
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload} 
              disabled={loading || pdfData.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint} 
              disabled={loading || pdfData.length === 0}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/hospitalization/orders/${patientId}`)} 
              disabled={!patientId}
            >
              <FileText className="w-4 h-4 mr-2" />
              Ir a Órdenes
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => router.push('/hospitalization')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Hospitalización
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
