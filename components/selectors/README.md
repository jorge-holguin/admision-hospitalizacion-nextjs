# Selectores Reutilizables

Esta carpeta contiene componentes de selección que pueden ser reutilizados en diferentes partes de la aplicación.

## Estructura Propuesta

### Selectores de Emergencia
- `ConsultorioEmergencySelector.tsx` - Selector de consultorios de emergencia
- `MotivoEmergenciaSelector.tsx` - Selector de motivos de emergencia
- `FormaIngresoSelector.tsx` - Selector de formas de ingreso

### Selectores de Hospitalización
- `ConsultorioHospitalizationSelector.tsx` - Selector de consultorios de hospitalización
- `OrigenHospitalizacionSelector.tsx` - Selector de orígenes de hospitalización
- `DiagnosticoSelector.tsx` - Selector de diagnósticos con filtrado por origen

### Selectores Generales
- `MedicoSelector.tsx` - Selector de médicos
- `SeguroSelector.tsx` - Selector de seguros
- `TipoDocumentoSelector.tsx` - Selector de tipos de documento
- `SearchableSelect.tsx` - Componente base para selectores con búsqueda

## Principios de Diseño

1. **Reutilización**: Cada selector debe ser independiente y reutilizable
2. **Contextos**: Usar contextos centralizados para evitar llamadas API duplicadas
3. **Props consistentes**: Mantener interfaces similares entre selectores
4. **Accesibilidad**: Incluir labels, aria-labels y navegación por teclado
5. **Performance**: Implementar debounce para búsquedas y virtualización si es necesario

## Migración

Los selectores existentes en otras carpetas deberían moverse aquí gradualmente para:
- Centralizar la lógica de selección
- Facilitar el mantenimiento
- Promover la reutilización
- Mantener consistencia en la UI/UX
