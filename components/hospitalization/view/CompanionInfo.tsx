"use client"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CompanionInfoProps {
  companionData: any;
  isEditable: boolean;
  fieldsLocked: boolean;
  onChange: (updatedData: any) => void;
}

export function CompanionInfo({ companionData, isEditable, fieldsLocked, onChange }: CompanionInfoProps) {
  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Datos del Acompañante</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
        <div className="space-y-2">
          <Label htmlFor="companionName" className="font-medium text-black-600">Nombres y apellidos del acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="companionName"
            value={companionData?.ACOMPANANTE_NOMBRE || ''}
            onChange={(e) => {
              if (isEditable) {
                onChange({ ACOMPANANTE_NOMBRE: e.target.value });
              }
            }}
            readOnly={!isEditable}
            disabled={fieldsLocked}
            className="w-full font-medium"
            placeholder={isEditable ? "Ingrese nombre del acompañante" : "No registrado"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companionPhone" className="font-medium text-black-600">Teléfono del acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="companionPhone"
            value={companionData?.ACOMPANANTE_TELEFONO || ''}
            onChange={(e) => {
              if (isEditable) {
                onChange({ ACOMPANANTE_TELEFONO: e.target.value });
              }
            }}
            readOnly={!isEditable}
            disabled={fieldsLocked}
            className="w-full font-medium"
            placeholder={isEditable ? "Ingrese teléfono del acompañante" : "No registrado"}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="companionAddress" className="font-medium text-black-600">Domicilio del acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="companionAddress"
            value={companionData?.ACOMPANANTE_DIRECCION || ''}
            onChange={(e) => {
              if (isEditable) {
                onChange({ ACOMPANANTE_DIRECCION: e.target.value });
              }
            }}
            readOnly={!isEditable}
            disabled={fieldsLocked}
            className="w-full font-medium"
            placeholder={isEditable ? "Ingrese domicilio del acompañante" : "No registrado"}
          />
        </div>
      </div>
    </>
  );
}
