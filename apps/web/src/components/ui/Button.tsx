import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }, ref) => {
    const baseStyles = 'rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary: 'bg-suenos-violet text-white hover:bg-suenos-violet-light shadow-lg shadow-suenos-violet/25',
      secondary: 'bg-suenos-surface text-suenos-text border border-suenos-border hover:border-suenos-cyan/50 hover:text-suenos-cyan',
      danger: 'bg-red-500/90 text-white hover:bg-red-500',
      ghost: 'bg-transparent text-suenos-muted hover:bg-suenos-surface hover:text-suenos-text',
    };
    const sizes = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? 'Cargando...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
