# Componentes de Emergencia

Esta carpeta contiene todos los componentes relacionados con el módulo de emergencia del sistema hospitalario.

## Estructura

```
components/emergency/
├── modals/                    # Componentes de modales
│   ├── EmergencyModal.tsx           # Modal principal de emergencia
│   ├── PatientSearchModal.tsx       # Modal de búsqueda de pacientes
│   ├── EmergencyRegistrationModal.tsx # Modal de registro de emergencia
│   └── index.ts                     # Exportaciones de modales
├── selectors/                 # Componentes selectores
│   ├── ConsultorioEmergencySelector.tsx # Selector de consultorios
│   ├── MedicoEmergencySelector.tsx      # Selector de médicos
│   └── index.ts                         # Exportaciones de selectores
├── register/                  # Componentes de registro
│   ├── EmergencyFormRefactored.tsx      # Formulario principal
│   ├── EmergencySection.tsx             # Sección de datos de emergencia
│   ├── EmergencyDetails.tsx             # Detalles de emergencia
│   ├── AdditionalFieldsSection.tsx      # Campos adicionales
│   ├── FormActionsEmergency.tsx         # Acciones del formulario
│   ├── FormHeaderEmergency.tsx          # Encabezado del formulario
│   ├── PatientSectionEmergency.tsx      # Sección de paciente
│   ├── FuaEmergencyStatusAlert.tsx      # Alerta de estado FUA
│   ├── FormUtilsEmergency.tsx           # Utilidades del formulario
│   ├── FormValidatorEmergency.tsx       # Validador del formulario
│   └── SqlGenerator.ts                  # Generador de SQL
├── view/                      # Componentes de visualización
│   ├── EmergencySectionView.tsx         # Vista de sección de emergencia
│   ├── AdditionalViewFieldsSection.tsx  # Vista de campos adicionales
│   └── PatientSectionEmergency.tsx      # Vista de sección de paciente
├── PatientInfoCardEmergency.tsx # Tarjeta de información del paciente
└── index.ts                   # Exportaciones principales
```

## Uso del Modal Principal de Emergencia

### Importación

```tsx
import { EmergencyMainModal } from '@/components/emergency'
```

### Uso Básico

```tsx
function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const handleEmergencyClick = (patient) => {
    // Guardar datos del paciente en contexto
    setPatientData({
      hc: patient.HISTORIA,
      name: patient.NOMBRES,
      documento: patient.DOCUMENTO,
      pacienteId: patient.PACIENTE
    });
    
    setSelectedPatient(patient)
    setIsModalOpen(true)
  }

  return (
    <>
      <Button onClick={() => handleEmergencyClick(patient)}>
        Emergencia
      </Button>
      
      <EmergencyMainModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPatient(null)
        }}
        patientId={selectedPatient?.PACIENTE || ''}
      />
    </>
  )
}
```

### Props del EmergencyMainModal

- `isOpen: boolean` - Controla si el modal está abierto
- `onClose: () => void` - Callback cuando se cierra el modal
- `patientId: string` - ID del paciente para cargar sus emergencias

## Flujo del Modal

1. **Lista de Emergencias**: Muestra todas las emergencias del paciente seleccionado
2. **Crear Nueva**: Botón para crear una nueva emergencia
3. **Ver/Editar**: Botones para ver o editar emergencias existentes
4. **Navegación**: Flujo completo entre lista → crear/editar → volver a lista
5. **Estados**: Respeta los estados de emergencia (solo REGISTRADO es editable)

## Características

- ✅ **Modal responsivo**: Se adapta a diferentes tamaños de pantalla
- ✅ **Búsqueda de pacientes**: Integrada con el hook `useFiliacion`
- ✅ **Validación SIS**: Incluye verificación de seguro SIS
- ✅ **Formulario completo**: Todos los campos necesarios para emergencia
- ✅ **Manejo de errores**: Callbacks para éxito y error
- ✅ **Navegación fluida**: Entre búsqueda y registro
- ✅ **Auto-cierre**: Después del registro exitoso

## Integración con Filiación

El modal se integra perfectamente con la página de filiación:

```tsx
// En app/filiation/page.tsx
const handleEmergencySelect = (patient: any) => {
  setSelectedPatientForEmergency(patient)
  setIsEmergencyModalOpen(true)
}
```

## Componentes Reutilizables

Todos los componentes están organizados para máxima reutilización:

- **Selectores**: Pueden usarse en cualquier formulario
- **Modales**: Diseño modular y extensible  
- **Formularios**: Adaptables a diferentes contextos
- **Validadores**: Lógica de validación centralizada

## Notas Técnicas

- Usa `Dialog` de shadcn/ui para el modal base
- Integra con contextos existentes (`PatientContext`, `PatientAccountContext`)
- Compatible con el sistema de autenticación existente
- Maneja estados de carga y error apropiadamente
