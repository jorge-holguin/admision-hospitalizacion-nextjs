import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdditionalFieldsSectionProps {
  formData: any;
  onFormChange: (field: string, value: string) => void;
  validationErrors: Record<string, string>;
  disabled: boolean;
}

export const AdditionalFieldsSection: React.FC<AdditionalFieldsSectionProps> = ({
  formData,
  onFormChange,
  validationErrors,
  disabled
}) => {
  return (
    <div className="space-y-6 mt-6">

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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoDocumentoA">Tipo Documento Acompañante <span className="text-red-500">*</span></Label>
            <Select
              value={formData.tipoDocumentoA || ''}
              onValueChange={(value) => onFormChange('tipoDocumentoA', value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
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
            />
          </div>
        </div>
      </div>
  );
};

export default AdditionalFieldsSection;
