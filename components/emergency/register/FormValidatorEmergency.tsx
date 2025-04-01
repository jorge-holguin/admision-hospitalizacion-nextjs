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

  // Validar médico
  if (!formData.medico || formData.medico.trim() === '') {
    errors.medico = 'El médico es requerido';
  }

  // Validar seguro
  if (!formData.seguro || formData.seguro.trim() === '') {
    errors.seguro = 'El seguro es requerido';
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

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default validateEmergencyForm;
