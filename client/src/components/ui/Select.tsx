// src/components/ui/Select.tsx
import { SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

export default function Select({ label, options, error, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <select 
        className={`p-3 border rounded-lg focus:ring-2 outline-none transition-all bg-white
        ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${className}`}
        {...props}
      >
        <option value="" disabled>Sélectionner...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}