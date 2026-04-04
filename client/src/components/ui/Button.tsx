import { forwardRef } from 'react';
// Correction TS1484 : Utilisation de "import type" pour les types React
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', isLoading, className = '', disabled, ...props }, ref) => {
    const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
    
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20",
      secondary: "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20",
      outline: "border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 bg-white",
      danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100"
    };

    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variants[variant]} ${className}`}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && (
          <span className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4 mr-1"></span>
        )}
        <span className="flex items-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;