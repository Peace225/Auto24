import { forwardRef } from 'react';
// Correction TS1484 : Utilisation de "import type"
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col w-full gap-1.5">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
        </label>
        
        <div className="relative">
          <input 
            ref={ref}
            className={`
              w-full p-4 bg-white border rounded-2xl outline-none transition-all duration-200
              font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium
              ${error 
                ? 'border-red-500 focus:ring-4 focus:ring-red-500/5' 
                : 'border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 focus:bg-white'
              } 
              ${className}
            `}
            {...props}
          />
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

Input.displayName = 'Input';

export default Input;