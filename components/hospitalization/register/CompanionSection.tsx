import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CompanionSectionProps {
  companionName: string;
  companionPhone: string;
  companionAddress: string;
  companionDni: string;
  companionEmail: string;
  companionRelationship: string;
  onCompanionChange: (field: string, value: string) => void;
  validationErrors: Record<string, string>;
  disabled?: boolean;
}

export const CompanionSection: React.FC<CompanionSectionProps> = ({
  companionName,
  companionPhone,
  companionAddress,
  companionDni,
  companionEmail,
  companionRelationship,
  onCompanionChange,
  validationErrors,
  disabled = false
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Datos del Acompañante</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
        {/* Nombre del acompañante */}
        <div className="space-y-2">
          <Label htmlFor="companionName" className="font-medium text-black-600">Nombre del acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="companionName"
            value={companionName}
            onChange={(e) => {
              onCompanionChange('companionName', e.target.value);
            }}
            className={`w-full font-medium ${validationErrors.companionName ? 'border-red-500' : ''}`}
            placeholder="Ingrese nombre del acompañante"
            disabled={disabled}
          />
          {validationErrors.companionName && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.companionName}</p>
          )}
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="companionPhone" className="font-medium text-black-600">Teléfono <span className="text-red-500">*</span></Label>
          <Input
            id="companionPhone"
            value={companionPhone}
            onChange={(e) => {
              onCompanionChange('companionPhone', e.target.value);
            }}
            className={`w-full font-medium ${validationErrors.companionPhone ? 'border-red-500' : ''}`}
            placeholder="Ingrese teléfono del acompañante"
            disabled={disabled}
          />
          {validationErrors.companionPhone && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.companionPhone}</p>
          )}
        </div>

        {/* Domicilio */}
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="companionAddress" className="font-medium text-black-600">Domicilio del acompañante <span className="text-red-500">*</span></Label>
          <Input
            id="companionAddress"
            value={companionAddress}
            onChange={(e) => {
              onCompanionChange('companionAddress', e.target.value);
            }}
            className={`w-full font-medium ${validationErrors.companionAddress ? 'border-red-500' : ''}`}
            placeholder="Ingrese domicilio del acompañante"
            disabled={disabled}
          />
          {validationErrors.companionAddress && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.companionAddress}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanionSection;
