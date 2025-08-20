import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdditionalViewFieldsSectionProps {
  formData: any;
  onFormChange: (field: string, value: string) => void;
  validationErrors: Record<string, string>;
  disabled: boolean;
}

export const AdditionalViewFieldsSection: React.FC<AdditionalViewFieldsSectionProps> = ({
  formData,
  onFormChange,
  validationErrors,
  disabled
}) => {
  // Mapeo de códigos de tipo de documento a valores del select
  useEffect(() => {
    // Si tenemos un tipo de documento del API, mapearlo al formato del select
    if (formData.tipoDocumentoA) {
      const tipoDoc = formData.tipoDocumentoA.trim();
      let mappedValue = tipoDoc;
      
      // Mapear códigos según la documentación
      if (tipoDoc === 'D') mappedValue = 'DNI';
      else if (tipoDoc === 'CE') mappedValue = 'CE';
      else if (tipoDoc === 'PP') mappedValue = 'PAS';
      
      // Solo actualizar si es diferente para evitar bucles
      if (mappedValue !== formData.tipoDocumentoA) {
        onFormChange('tipoDocumentoA', mappedValue);
      }
    }
  }, [formData.tipoDocumentoA]);
  
  return (
    <div className="space-y-6 mt-6" data-testid="additional-view-fields-section">
      {/* Cuarta fila - Datos del Acompañante */}
      <h3 className="text-lg font-semibold mb-4">Datos del Acompañante</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="acompanante">Nombre del Acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="acompanante"
            value={formData.acompanante || ''}
            onChange={(e) => onFormChange('acompanante', e.target.value)}
            disabled={disabled}
            placeholder="Nombre completo..."
            className="md:text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoDocumentoA">Tipo Documento Acompañante <span className="text-red-500">*</span></Label>
          <Select
            value={formData.tipoDocumentoA || ''}
            onValueChange={(value) => onFormChange('tipoDocumentoA', value)}
            disabled={disabled}
          >
            <SelectTrigger className="md:text-sm">
              <SelectValue placeholder="Seleccionar tipo..." />
            </SelectTrigger>
            <SelectContent className="md:text-sm">
              <SelectItem value="DNI">DNI</SelectItem>
              <SelectItem value="CE">Carnet de Extranjería</SelectItem>
              <SelectItem value="PAS">Pasaporte</SelectItem>
              <SelectItem value="OTROS">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentoA">Documento Acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="documentoA"
            value={formData.documentoA || ''}
            onChange={(e) => onFormChange('documentoA', e.target.value)}
            disabled={disabled}
            placeholder="Número de documento..."
            className="md:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalViewFieldsSection;
