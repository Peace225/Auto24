// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export default function Button({ children, variant = 'primary', isLoading, className = '', ...props }: ButtonProps) {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-orange-500 text-white hover:bg-orange-600",
    outline: "border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600",
    danger: "bg-red-50 text-red-600 hover:bg-red-100"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></span>
      ) : null}
      {children}
    </button>
  );
}