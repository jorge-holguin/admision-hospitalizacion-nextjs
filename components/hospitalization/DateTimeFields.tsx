import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateTimeFieldsProps {
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  disabled?: boolean;
  autoFill?: boolean;
}

export const DateTimeFields: React.FC<DateTimeFieldsProps> = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled = false,
  autoFill = false
}) => {
  // Obtener la fecha actual en formato YYYY-MM-DD para el valor por defecto
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Obtener la hora actual en formato HH:MM para el valor por defecto
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // Si autoFill está activado, actualizar la fecha y hora automáticamente cada minuto
  React.useEffect(() => {
    if (!autoFill) return;
    
    // Actualizar inicialmente
    if (!dateValue) onDateChange(getCurrentDate());
    if (!timeValue) onTimeChange(getCurrentTime());
    
    // Configurar intervalo para actualizar la hora cada minuto
    const intervalId = setInterval(() => {
      if (!disabled) {
        onTimeChange(getCurrentTime());
      }
    }, 60000); // 60000 ms = 1 minuto
    
    return () => clearInterval(intervalId);
  }, [autoFill, disabled, dateValue, timeValue, onDateChange, onTimeChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="date">Fecha de Ingreso</Label>
        <Input
          type="date"
          id="date"
          value={dateValue || getCurrentDate()}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full"
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="time">Hora de Ingreso</Label>
        <Input
          type="time"
          id="time"
          value={timeValue || getCurrentTime()}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-full"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
