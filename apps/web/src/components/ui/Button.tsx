import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }, ref) => {
    const baseStyles = 'rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary: 'bg-primary text-white hover:bg-indigo-600 shadow-[0_18px_34px_-16px_rgba(99,102,241,0.7)]',
      secondary: 'bg-cloud-50 text-ink border border-ink/[0.12] hover:bg-cloud-100',
      danger: 'bg-red-500 text-white hover:bg-red-600',
      ghost: 'bg-transparent text-ink-muted hover:bg-cloud-100 hover:text-ink',
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
