"use client"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CompanionFormProps {
  companionName: string;
  companionPhone: string;
  companionAddress: string;
  onChange: (field: string, value: string) => void;
  disabled?: boolean;
}

export function CompanionForm({
  companionName,
  companionPhone,
  companionAddress,
  onChange,
  disabled = false
}: CompanionFormProps) {
  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-medium">Datos del Acompañante</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companionName">Nombre del Acompañante</Label>
          <Input
            id="companionName"
            value={companionName}
            onChange={(e) => onChange('companionName', e.target.value)}
            placeholder="Nombre completo del acompañante"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companionPhone">Teléfono del Acompañante</Label>
          <Input
            id="companionPhone"
            value={companionPhone}
            onChange={(e) => onChange('companionPhone', e.target.value)}
            placeholder="Número de teléfono"
            disabled={disabled}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="companionAddress">Dirección del Acompañante</Label>
        <Input
          id="companionAddress"
          value={companionAddress}
          onChange={(e) => onChange('companionAddress', e.target.value)}
          placeholder="Dirección completa"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
