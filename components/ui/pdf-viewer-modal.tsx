"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Printer, X, Download, ChevronLeft, ChevronRight } from 'lucide-react'

interface PDFViewerModalProps {
  open: boolean
  onClose: () => void
  pdfUrls: string[]
  title: string
}

export function PDFViewerModal({ open, onClose, pdfUrls, title }: PDFViewerModalProps) {
  const [loading, setLoading] = useState(true)
  const [currentPdfIndex, setCurrentPdfIndex] = useState(0)
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
        } catch (error) {
          console.error('Error loading PDFs:', error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchPdfs()
    }
  }, [open, pdfUrls])

  const handlePrint = () => {
    if (pdfData[currentPdfIndex]) {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = pdfData[currentPdfIndex]
      document.body.appendChild(iframe)
      
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
          document.body.removeChild(iframe)
        }, 100)
      }
    }
  }

  const handleDownload = () => {
    if (pdfData[currentPdfIndex]) {
      const link = document.createElement('a')
      link.href = pdfData[currentPdfIndex]
      link.download = `documento-${currentPdfIndex + 1}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const goToPreviousPdf = () => {
    if (currentPdfIndex > 0) {
      setCurrentPdfIndex(currentPdfIndex - 1)
    }
  }

  const goToNextPdf = () => {
    if (currentPdfIndex < pdfData.length - 1) {
      setCurrentPdfIndex(currentPdfIndex + 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center space-x-2 text-sm font-normal">
              {pdfData.length > 1 && (
                <span className="text-gray-600">
                  Documento {currentPdfIndex + 1} de {pdfData.length}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 bg-gray-100 rounded-md overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="lg" />
              <span className="ml-2">Cargando documento...</span>
            </div>
          ) : pdfData.length > 0 ? (
            <iframe 
              src={pdfData[currentPdfIndex]} 
              className="w-full h-full border-0"
              title={`PDF Viewer ${currentPdfIndex + 1}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-red-500">Error al cargar el documento</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center pt-4">
          <div className="flex space-x-2">
            {pdfData.length > 1 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPreviousPdf} 
                  disabled={currentPdfIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextPdf} 
                  disabled={currentPdfIndex === pdfData.length - 1}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </div>
          
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
            <Button variant="default" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
