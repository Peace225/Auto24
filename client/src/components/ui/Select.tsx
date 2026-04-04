import { forwardRef } from 'react';
// Correction TS1484 : Utilisation obligatoire de "import type" pour les types
import type { SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col w-full gap-1.5">
        {/* Label style "Ultra Premium" identique à Input.tsx */}
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
        
        <div className="relative group">
          <select 
            ref={ref}
            className={`
              w-full p-4 bg-white border rounded-2xl outline-none transition-all duration-200
              font-bold text-slate-700 appearance-none cursor-pointer
              ${error 
                ? 'border-red-500 focus:ring-4 focus:ring-red-500/5' 
                : 'border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5'
              } 
              ${className}
            `}
            {...props}
          >
            <option value="" disabled>Sélectionner une option</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="font-medium text-slate-700">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Icône personnalisée pour le dropdown (car appearance-none est utilisé) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>

        {error && (
          <span className="text-[10px] font-bold text-red-500 mt-1 ml-1 flex items-center gap-1 uppercase tracking-tight">
            <span className="w-1 h-1 bg-red-500 rounded-full inline-block"></span>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;