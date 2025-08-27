import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { OptionItem } from '@/components/ui/SearchableSelect';

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
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [loadingTiposDocumento, setLoadingTiposDocumento] = useState(false);
  const [searchTipoDocumento, setSearchTipoDocumento] = useState('');

  // Cargar tipos de documento desde la API
  const loadTiposDocumento = async (search: string = '') => {
    try {
      setLoadingTiposDocumento(true);
      
      const url = `/api/tipo-documento${search ? `?search=${encodeURIComponent(search)}` : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // La API devuelve directamente el array de tipos de documento
      if (Array.isArray(data) && data.length > 0) {
        setTiposDocumento(data);
      } else {
        console.warn('API devolvió datos vacíos o inválidos, usando datos de respaldo');
        // Fallback para datos de prueba si la API falla
        const fallbackData = [
          { TIPO_DOCUMENTO: 'D', NOMBRE: 'DNI', ACTIVO: 1 },
          { TIPO_DOCUMENTO: 'CE', NOMBRE: 'Carnet de Extranjería', ACTIVO: 1 },
          { TIPO_DOCUMENTO: 'PP', NOMBRE: 'Pasaporte', ACTIVO: 1 },
          { TIPO_DOCUMENTO: '0', NOMBRE: 'Ninguno', ACTIVO: 1 }
        ];
        setTiposDocumento(fallbackData);
      }
    } catch (error) {
      console.error('Error al cargar tipos de documento:', error);
      // Datos de respaldo en caso de error
      const fallbackData = [
        { TIPO_DOCUMENTO: 'D', NOMBRE: 'DNI', ACTIVO: 1 },
        { TIPO_DOCUMENTO: 'CE', NOMBRE: 'Carnet de Extranjería', ACTIVO: 1 },
        { TIPO_DOCUMENTO: 'PP', NOMBRE: 'Pasaporte', ACTIVO: 1 },
        { TIPO_DOCUMENTO: '0', NOMBRE: 'Ninguno', ACTIVO: 1 }
      ];
      setTiposDocumento(fallbackData);
    } finally {
      setLoadingTiposDocumento(false);
    }
  };

  useEffect(() => {
    loadTiposDocumento();
  }, []);
  
  // Formato para el SearchableSelect
  const formatTiposDocumento = useMemo(() => {
    return tiposDocumento
      .filter(t => !searchTipoDocumento || 
        t.NOMBRE?.toLowerCase().includes(searchTipoDocumento.toLowerCase()))
      .map(t => ({
        value: t.TIPO_DOCUMENTO,
        display: `(${t.TIPO_DOCUMENTO}) - ${t.NOMBRE}`,
        description: '',
        data: t
      }));
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
                loadTiposDocumento(v);
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
