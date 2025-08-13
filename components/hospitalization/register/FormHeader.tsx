import React from 'react';
import { DateTimeFields } from '@/components/hospitalization/DateTimeFields';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FormHeaderProps {
  date: string;
  time: string;
  historyNumber?: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  disabled?: boolean;
  validationErrors?: Record<string, string>;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  date,
  time,
  historyNumber,
  onDateChange,
  onTimeChange,
  disabled = false,
  validationErrors = {}
}) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <div className="mb-2 font-medium text-sm">Historia Clínica</div>
          <div className="text-lg font-semibold">{historyNumber || 'N/A'}</div>
        </div>
        <div className="col-span-2">
          <DateTimeFields
            dateValue={date}
            timeValue={time}
            onDateChange={onDateChange}
            onTimeChange={onTimeChange}
            disabled={disabled}
            autoFill={false}
          />
        </div>
      </div>
    </div>
  );
};

export default FormHeader;
