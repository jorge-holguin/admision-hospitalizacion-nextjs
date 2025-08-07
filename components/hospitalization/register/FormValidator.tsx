"use client"

import { toast } from "@/components/ui/use-toast"

interface FormData {
  date: string;
  time: string;
  hospitalizationOrigin: string;
  attentionOrigin: string;
  hospitalizedIn: string;
  authorizingDoctor: string;
  financing: string;
  diagnosis: string;
  [key: string]: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateHospitalizationForm(formData: FormData): ValidationResult {
  const errors: Record<string, string> = {};
  
  console.log('Validando formulario con procedencia:', formData.procedencia);
  
  // Si la procedencia es RN, solo validamos fecha y hora
  if (formData.procedencia === 'RN') {
    console.log('Procedencia es RN - aplicando validación especial');
    
    // Para RN, solo validamos fecha y hora
    const rnRequiredFields = [
      { key: 'date', label: 'Fecha' },
      { key: 'time', label: 'Hora' }
    ];
    
    rnRequiredFields.forEach(field => {
      if (!formData[field.key]?.trim()) {
        errors[field.key] = `El campo ${field.label} es obligatorio`;
      }
    });
  } else {
    // Para otros casos, validamos todos los campos normalmente
    console.log('Procedencia no es RN - aplicando validación normal');
    
    const requiredFields = [
      { key: 'date', label: 'Fecha' },
      { key: 'time', label: 'Hora' },
      { key: 'hospitalizationOrigin', label: 'Origen de Hospitalización' },
      { key: 'attentionOrigin', label: 'Origen de Atención' },
      { key: 'hospitalizedIn', label: 'Hospitalizado en' },
      { key: 'authorizingDoctor', label: 'Médico Autorizante' },
      { key: 'financing', label: 'Financiamiento' },
      { key: 'diagnosis', label: 'Diagnóstico' }
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field.key]?.trim()) {
        errors[field.key] = `El campo ${field.label} es obligatorio`;
      }
    });
  }
  
  // Validar formato de fecha
  if (formData.date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
    errors.date = 'El formato de fecha debe ser YYYY-MM-DD';
  }
  
  // Validar formato de hora
  if (formData.time && !/^\d{2}:\d{2}$/.test(formData.time)) {
    errors.time = 'El formato de hora debe ser HH:MM';
  }
  
  // Mostrar errores en toast si existen
  if (Object.keys(errors).length > 0) {
    const errorMessages = Object.values(errors).join('\n');
    toast({
      title: "Error de validación",
      description: errorMessages,
      variant: "destructive"
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
