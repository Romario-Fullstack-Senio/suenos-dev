import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', type, ...props }, ref) => {
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const esPassword = type === 'password';

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-semibold text-ink-muted mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={esPassword && mostrarPassword ? 'text' : type}
            className={`w-full px-3 py-2 bg-cloud-50 text-ink placeholder:text-ink-soft border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              esPassword ? 'pr-10' : ''
            } ${error ? 'border-red-500' : 'border-ink/[0.12]'} ${className}`}
            {...props}
          />
          {esPassword && (
            <button
              type="button"
              onClick={() => setMostrarPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-soft hover:text-ink transition-colors"
              tabIndex={-1}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
