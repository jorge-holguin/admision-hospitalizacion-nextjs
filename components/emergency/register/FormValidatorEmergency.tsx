export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmergencyForm = (formData: any): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validar fecha
  if (!formData.fecha || formData.fecha.trim() === '') {
    errors.fecha = 'La fecha es requerida';
  }

  // Validar hora
  if (!formData.hora || formData.hora.trim() === '') {
    errors.hora = 'La hora es requerida';
  }

  // Validar motivo de emergencia
  if (!formData.motivoEmergencia || formData.motivoEmergencia.trim() === '') {
    errors.motivoEmergencia = 'El motivo de emergencia es requerido';
  }

  // Validar consultorio
  if (!formData.consultorio || formData.consultorio.trim() === '') {
    errors.consultorio = 'El consultorio es requerido';
  }
  
  // Validar nombre del acompañante
  if (!formData.acompanante || formData.acompanante.trim() === '') {
    errors.acompanante = 'El nombre del acompañante es requerido';
  }
  
  // Validar documento del acompañante
  if (!formData.documentoA || formData.documentoA.trim() === '') {
    errors.documentoA = 'El documento del acompañante es requerido';
  }
  
  // Validar condición del paciente (seguro)
  if (!formData.seguro || formData.seguro.trim() === '') {
    errors.seguro = 'La condición del paciente es requerida';
  }

  // Validar que la fecha no sea futura
  if (formData.fecha) {
    const selectedDate = new Date(formData.fecha);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    
    if (selectedDate > today) {
      errors.fecha = 'La fecha no puede ser futura';
    }
  }

  // Validar formato de hora
  if (formData.hora) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.hora)) {
      errors.hora = 'Formato de hora inválido (HH:MM)';
    }
  }

  // Mostrar resumen de validación
  const isValid = Object.keys(errors).length === 0;

  return {
    isValid: isValid,
    errors
  };
};

export default validateEmergencyForm;
