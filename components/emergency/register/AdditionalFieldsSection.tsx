import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { OptionItem } from '@/components/ui/SearchableSelect';
import { useTiposDocumento } from '@/contexts/TiposDocumentoContext';

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
  // Usar contexto en lugar de estado local
  const { tiposDocumento, loading: loadingTiposDocumento } = useTiposDocumento();
  const [searchTipoDocumento, setSearchTipoDocumento] = useState('');

  // Ya no necesitamos cargar datos manualmente, usamos el contexto
  console.log('📄 Tipos de documento disponibles desde contexto:', tiposDocumento?.length || 0);
  console.log('📄 Datos de tipos de documento:', tiposDocumento);
  console.log('📄 Loading tipos documento:', loadingTiposDocumento);
  
  // Formato para el SearchableSelect
  const formatTiposDocumento = useMemo(() => {
    // Validar que tiposDocumento sea un array válido
    if (!Array.isArray(tiposDocumento)) {
      console.warn('📄 tiposDocumento no es un array válido:', tiposDocumento);
      return [];
    }
    
    const formatted = tiposDocumento
      .filter(t => t && t.TIPO_DOCUMENTO && t.NOMBRE) // Validar que los objetos tengan las propiedades necesarias
      .filter(t => !searchTipoDocumento || 
        t.NOMBRE?.toLowerCase().includes(searchTipoDocumento.toLowerCase()))
      .map(t => ({
        value: t.TIPO_DOCUMENTO,
        display: `(${t.TIPO_DOCUMENTO}) - ${t.NOMBRE}`,
        description: '',
        data: t
      }));
    
    console.log('📄 Opciones formateadas para SearchableSelect:', formatted);
    return formatted;
  }, [tiposDocumento, searchTipoDocumento]);
  
    
  // Función para manejar el cambio de tipo de documento
  const onTipoDocumentoChange = (value: string, data: any) => {
    // Puedes agregar lógica adicional aquí si es necesario
  };
  
  // Establecer valor por defecto para tipo de documento si no está definido
  useEffect(() => {
    // Solo establecer el valor por defecto si no hay un valor existente
    if (tiposDocumento.length > 0) {
      // Si no hay valor o si el valor es '0 - Ninguno', establecer a DNI
      const shouldSetDefault = 
        !formData.tipoDocumentoA || 
        !formData.tipoDocumentoADisplay || 
        formData.tipoDocumentoA === '0' || 
        formData.tipoDocumentoADisplay?.includes('Ninguno');
      
      if (shouldSetDefault) {
        // Buscar DNI en los tipos de documento
        const defaultDoc = tiposDocumento.find(t => t.TIPO_DOCUMENTO === 'D');
        
        if (defaultDoc) {
          onFormChange('tipoDocumentoA', defaultDoc.TIPO_DOCUMENTO);
          onFormChange('tipoDocumentoADisplay', `(${defaultDoc.TIPO_DOCUMENTO}) - ${defaultDoc.NOMBRE}`);
        }
      }
    }
  }, [tiposDocumento, formData.tipoDocumentoA, formData.tipoDocumentoADisplay]);
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
