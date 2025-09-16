import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface ShiftFilterProps {
  onShiftChange: (shift: 'MAÑANA' | 'TARDE' | 'ALL') => void;
  className?: string;
}

export function ShiftFilter({ onShiftChange, className = '' }: ShiftFilterProps) {
  const [selectedShift, setSelectedShift] = useState<'MAÑANA' | 'TARDE' | 'ALL'>('ALL');

  const handleShiftChange = (shift: 'MAÑANA' | 'TARDE' | 'ALL') => {
    setSelectedShift(shift);
    onShiftChange(shift);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex rounded-lg border border-gray-200 p-1 shadow-sm">
        <Button
          variant={selectedShift === 'MAÑANA' ? "default" : "ghost"}
          size="sm"
          className={`flex items-center gap-1 rounded-md px-3 ${
            selectedShift === 'MAÑANA' 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'text-gray-600 hover:bg-blue-50'
          }`}
          onClick={() => handleShiftChange('MAÑANA')}
        >
          <Sun className="h-4 w-4" />
          <span className="ml-1">Mañana</span>
        </Button>
        <Button
          variant={selectedShift === 'TARDE' ? "default" : "ghost"}
          size="sm"
          className={`flex items-center gap-1 rounded-md px-3 ${
            selectedShift === 'TARDE' 
              ? 'bg-orange-500 text-white hover:bg-orange-600' 
              : 'text-gray-600 hover:bg-orange-50'
          }`}
          onClick={() => handleShiftChange('TARDE')}
        >
          <Moon className="h-4 w-4" />
          <span className="ml-1">Tarde</span>
        </Button>
        <Button
          variant={selectedShift === 'ALL' ? "default" : "ghost"}
          size="sm"
          className={`flex items-center gap-1 rounded-md px-3 ${
            selectedShift === 'ALL' 
              ? 'bg-purple-500 text-white hover:bg-purple-600' 
              : 'text-gray-600 hover:bg-purple-50'
          }`}
          onClick={() => handleShiftChange('ALL')}
        >
          <span>Todos</span>
        </Button>
      </div>
    </div>
  );
}
