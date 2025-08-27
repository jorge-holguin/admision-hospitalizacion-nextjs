export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmergencyForm = (formData: any): ValidationResult => {
  const errors: Record<string, string> = {};
  console.log('Validando formulario con datos:', formData);

  // Validar fecha
  if (!formData.fecha || formData.fecha.trim() === '') {
    errors.fecha = 'La fecha es requerida';
    console.log('Error de validación: fecha vacía');
  }

  // Validar hora
  if (!formData.hora || formData.hora.trim() === '') {
    errors.hora = 'La hora es requerida';
    console.log('Error de validación: hora vacía');
  }

  // Validar motivo de emergencia
  if (!formData.motivoEmergencia || formData.motivoEmergencia.trim() === '') {
    errors.motivoEmergencia = 'El motivo de emergencia es requerido';
    console.log('Error de validación: motivo de emergencia vacío');
  }

  // Validar consultorio
  if (!formData.consultorio || formData.consultorio.trim() === '') {
    errors.consultorio = 'El consultorio es requerido';
    console.log('Error de validación: consultorio vacío');
  }
  
  // Validar nombre del acompañante
  if (!formData.acompanante || formData.acompanante.trim() === '') {
    errors.acompanante = 'El nombre del acompañante es requerido';
    console.log('Error de validación: nombre del acompañante vacío');
  }
  
  // Validar documento del acompañante
  if (!formData.documentoA || formData.documentoA.trim() === '') {
    errors.documentoA = 'El documento del acompañante es requerido';
    console.log('Error de validación: documento del acompañante vacío');
  }
  
  // Validar condición del paciente (seguro)
  if (!formData.seguro || formData.seguro.trim() === '') {
    errors.seguro = 'La condición del paciente es requerida';
    console.log('Error de validación: condición del paciente vacía');
  }

  // Validar médico - Hacemos esta validación opcional
  // El campo médico puede estar vacío o ser null/undefined
  if (formData.medico === undefined) {
    console.log('Campo médico es undefined, se considera válido');
  } else if (formData.medico === null) {
    console.log('Campo médico es null, se considera válido');
  } else if (formData.medico === '') {
    console.log('Campo médico está vacío, se considera válido');
  }

  // Validar que la fecha no sea futura
  if (formData.fecha) {
    const selectedDate = new Date(formData.fecha);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    
    if (selectedDate > today) {
      errors.fecha = 'La fecha no puede ser futura';
      console.log('Error de validación: fecha futura');
    }
  }

  // Validar formato de hora
  if (formData.hora) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.hora)) {
      errors.hora = 'Formato de hora inválido (HH:MM)';
      console.log('Error de validación: formato de hora inválido');
    }
  }

  // Mostrar resumen de validación
  const isValid = Object.keys(errors).length === 0;
  console.log('Resultado final de validación:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
  if (!isValid) {
    console.log('Campos con error:', Object.keys(errors));
  }

  return {
    isValid: isValid,
    errors
  };
};

export default validateEmergencyForm;
