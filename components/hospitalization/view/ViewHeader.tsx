"use client"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ViewHeaderProps {
  hospitalizationId: string;
  date: string;
  time: string;
  historyNumber?: string; // Añadido para mostrar el número de historia
}

export function ViewHeader({ hospitalizationId, date, time, historyNumber }: ViewHeaderProps) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Label htmlFor="historyNumber" className="font-medium">Nº Historia:</Label>
          <Input
            id="historyNumber"
            value={historyNumber || ''}
            readOnly
            disabled={true}
            className="font-medium mt-2"
          />
        </div>
        
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateField" className="font-medium">Fecha de Ingreso:</Label>
              <Input
                id="dateField"
                value={date}
                disabled={true}
                className="font-medium mt-2"
              />
            </div>
            <div>
              <Label htmlFor="timeField" className="font-medium">Hora de Ingreso:</Label>
              <Input
                id="timeField"
                value={time}
                disabled={true}
                className="font-medium mt-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
