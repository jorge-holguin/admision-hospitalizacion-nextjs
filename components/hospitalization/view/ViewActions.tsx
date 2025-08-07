"use client"

import { Button } from '@/components/ui/button'
import { Loader2, Save, ArrowLeft } from 'lucide-react'

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
            className="flex items-center gap-2"
          >
            Cancelar
          </Button>
          
          <Button 
            type="submit" 
            disabled={submitting} 
            className="flex items-center gap-2"
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
