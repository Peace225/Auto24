// src/components/ui/Input.tsx
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input 
        className={`p-3 border rounded-lg focus:ring-2 outline-none transition-all 
        ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}