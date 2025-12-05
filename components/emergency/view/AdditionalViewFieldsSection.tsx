import React, { useEffect, useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, OptionItem } from '@/components/ui/SearchableSelect';
import { useTipoDocumento } from '@/contexts/filiation/TipoDocumentoContext';

interface AdditionalViewFieldsSectionProps {
  formData: any;
  onFormChange: (field: string, value: string) => void;
  validationErrors: Record<string, string>;
  disabled: boolean;
  readOnly?: boolean;
}

export const AdditionalViewFieldsSection: React.FC<AdditionalViewFieldsSectionProps> = ({
  formData,
  onFormChange,
  validationErrors,
  disabled,
  readOnly = false
}) => {
  // Usar contexto global de tipos de documento
  const { tiposDocumento, isLoading: loadingTiposDocumento } = useTipoDocumento();
  const [searchTipoDocumento, setSearchTipoDocumento] = useState<string>('');

  // Formato para el SearchableSelect - mapear campos del contexto global
  const formatTiposDocumento = useMemo(() => {
    if (!Array.isArray(tiposDocumento)) {
      return [];
    }
    
    return tiposDocumento
      .filter(t => t && t.tipoDocumento && t.nombre)
      .filter(t => !searchTipoDocumento || 
        t.nombre?.toLowerCase().includes(searchTipoDocumento.toLowerCase()) ||
        t.tipoDocumento?.toLowerCase().includes(searchTipoDocumento.toLowerCase()))
      .map(t => ({
        value: t.tipoDocumento,
        display: `(${t.tipoDocumento}) - ${t.nombre}`,
        description: '',
        data: { TIPO_DOCUMENTO: t.tipoDocumento, NOMBRE: t.nombre }
      }));
  }, [tiposDocumento, searchTipoDocumento]);
  
  // Manejar cambio de tipo de documento
  const onTipoDocumentoChange = (value: string, data: any) => {
    // Lógica adicional si es necesaria
  };

  // Inicializar el valor de display para el tipo de documento usando datos de la API
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Solo ejecutar si no se ha inicializado o si cambia el tipo de documento
    if ((!initialized || !formData.tipoDocumentoADisplay) && formData.tipoDocumentoA && tiposDocumento.length > 0) {
      const tipoDoc = formData.tipoDocumentoA.trim();
      
      // Buscar el tipo de documento en los datos cargados desde el contexto global
      const tipoDocEncontrado = tiposDocumento.find(t => t.tipoDocumento === tipoDoc);
      
      if (tipoDocEncontrado) {
        // Si se encuentra en el contexto, usar el nombre
        const displayValue = `(${tipoDocEncontrado.tipoDocumento}) - ${tipoDocEncontrado.nombre}`;
        onFormChange('tipoDocumentoADisplay', displayValue);
      } else {
        // Fallback para códigos que no están en la API
        let displayValue = '';
        
        // Mapear códigos comunes a valores de display
        if (tipoDoc === 'D') displayValue = '(D) - DNI';
        else if (tipoDoc === 'CE') displayValue = '(CE) - Carnet de Extranjería';
        else if (tipoDoc === 'PAS') displayValue = '(PAS) - Pasaporte';
        else if (tipoDoc === 'OTROS') displayValue = '(OTROS) - Otros documentos';
        else displayValue = `(${tipoDoc}) - ${tipoDoc}`;
        
        onFormChange('tipoDocumentoADisplay', displayValue);
      }
      
      setInitialized(true);
    }
  }, [formData.tipoDocumentoA, tiposDocumento, initialized, formData.tipoDocumentoADisplay]);
  
  return (
    <div className="space-y-6 mt-6" data-testid="additional-view-fields-section">
      {/* Cuarta fila - Datos del Acompañante */}
      <h3 className="text-lg font-semibold mb-4">Datos del Acompañante</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg border border-gray-200">
        <div className="space-y-2">
          <Label htmlFor="acompanante">Nombre del Acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="acompanante"
            value={formData.acompanante || ''}
            onChange={(e) => onFormChange('acompanante', e.target.value)}
            disabled={disabled || readOnly}
            readOnly={readOnly}
            placeholder="Nombre completo..."
            className="md:text-sm"
          />
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
            disabled={disabled || readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="documentoA">Documento Acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="documentoA"
            value={formData.documentoA || ''}
            onChange={(e) => onFormChange('documentoA', e.target.value)}
            disabled={disabled || readOnly}
            readOnly={readOnly}
            placeholder="Número de documento..."
            className="md:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalViewFieldsSection;
