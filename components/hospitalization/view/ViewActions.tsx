"use client"

import { Button } from '@/components/ui/button'
import { Loader2, Save, ArrowLeft, X } from 'lucide-react'

interface ViewActionsProps {
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting: boolean;
  isEditable: boolean;
}

export function ViewActions({ onSave, onCancel, submitting, isEditable }: ViewActionsProps) {
  return (
    <div className="flex justify-end gap-4 mt-6">
      {isEditable && (
        <>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="bg-[#e91e63] hover:bg-[#d81b60] text-white hover:text-white"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          
          <Button 
            type="submit" 
            disabled={submitting} 
            className="bg-[#0074ba] hover:bg-[#0067a6] text-white hover:text-white"
            onClick={(e) => onSave(e)}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </>
      )}
      
      {!isEditable && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      )}
    </div>
  );
}
