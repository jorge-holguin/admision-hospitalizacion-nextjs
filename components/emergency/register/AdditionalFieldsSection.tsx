import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { OptionItem } from '@/components/ui/SearchableSelect';
import { useTipoDocumento } from '@/contexts/filiation/TipoDocumentoContext';

interface TipoDocumento {
  TIPO_DOCUMENTO: string;
  NOMBRE: string;
  ACTIVO: number;
}

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
  // Usar contexto global de tipos de documento
  const { tiposDocumento, isLoading: loadingTiposDocumento } = useTipoDocumento();
  const [searchTipoDocumento, setSearchTipoDocumento] = useState('');
  
  // Formato para el SearchableSelect - mapear campos del contexto global
  const formatTiposDocumento = useMemo(() => {
    if (!Array.isArray(tiposDocumento)) {
      return [];
    }
    
    return tiposDocumento
      .filter(t => t && t.tipoDocumento && t.nombre)
      .filter(t => !searchTipoDocumento || 
        t.nombre?.toLowerCase().includes(searchTipoDocumento.toLowerCase()))
      .map(t => ({
        value: t.tipoDocumento,
        display: `(${t.tipoDocumento}) - ${t.nombre}`,
        description: '',
        data: { TIPO_DOCUMENTO: t.tipoDocumento, NOMBRE: t.nombre }
      }));
  }, [tiposDocumento, searchTipoDocumento]);
  
    
  // Función para manejar el cambio de tipo de documento
  const onTipoDocumentoChange = (value: string, data: any) => {
    // Puedes agregar lógica adicional aquí si es necesario
  };
  
  // Establecer valor por defecto para tipo de documento si no está definido
  useEffect(() => {
    if (tiposDocumento.length > 0) {
      const shouldSetDefault = 
        !formData.tipoDocumentoA || 
        !formData.tipoDocumentoADisplay || 
        formData.tipoDocumentoA === '0' || 
        formData.tipoDocumentoADisplay?.includes('Ninguno');
      
      if (shouldSetDefault) {
        // Buscar DNI en los tipos de documento (código 'D')
        const defaultDoc = tiposDocumento.find(t => t.tipoDocumento === 'D');
        
        if (defaultDoc) {
          onFormChange('tipoDocumentoA', defaultDoc.tipoDocumento);
          onFormChange('tipoDocumentoADisplay', `(${defaultDoc.tipoDocumento}) - ${defaultDoc.nombre}`);
        }
      }
    }
  }, [tiposDocumento, formData.tipoDocumentoA, formData.tipoDocumentoADisplay]);
  return (
    <div className="space-y-6 mt-6">

      {/* Cuarta fila - Datos del Acompañante */}
        <h3 className="text-lg font-semibold mb-4">Datos del Acompañante</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg border border-gray-200">
          <div className="space-y-2">
            <Label htmlFor="acompanante">Nombre del Acompañante <span className="text-red-500">*</span></Label>
            <Input
              id="acompanante"
              value={formData.acompanante || ''}
              onChange={(e) => onFormChange('acompanante', e.target.value)}
              disabled={disabled}
              placeholder="Nombre completo..."
              required
              className={validationErrors?.acompanante ? 'border-red-500' : ''}
            />
            {validationErrors?.acompanante && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.acompanante}</p>
            )}
          </div>

          <div className="space-y-2">
            <SearchableSelect
              label="Tipo Documento Acompañante"
              value={formData.tipoDocumentoA === 'D' ? formData.tipoDocumentoADisplay : (formData.tipoDocumentoADisplay || '(D) - DNI')}
              options={formatTiposDocumento}
              loading={loadingTiposDocumento}
              search={searchTipoDocumento}
              onSearchChange={(v: string) => {
                setSearchTipoDocumento(v);
                // Filtrado local usando el contexto
              }}
              onSelect={(opt: OptionItem) => {
                onFormChange("tipoDocumentoA", opt.value);
                onFormChange("tipoDocumentoADisplay", opt.display);
                onTipoDocumentoChange(opt.value, opt.data);
              }}
              selectName="tipoDocumentoAcompanante"
              required
              error={validationErrors?.tipoDocumentoA || ''}
              placeholder="Seleccionar tipo de documento..."
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentoA">Documento Acompañante <span className="text-red-500">*</span></Label>
            <Input
              id="documentoA"
              value={formData.documentoA || ''}
              onChange={(e) => onFormChange('documentoA', e.target.value)}
              disabled={disabled}
              placeholder="Número de documento..."
              required
              className={validationErrors?.documentoA ? 'border-red-500' : ''}
            />
            {validationErrors?.documentoA && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.documentoA}</p>
            )}
          </div>
        </div>
      </div>
  );
};

export default AdditionalFieldsSection;
