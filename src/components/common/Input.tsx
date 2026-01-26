/**
 * Input component - Theme-aware text input with validation states
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  fullWidth = false,
  rightElement,
  className = '',
  ...props
}, ref) => {
  const baseInputStyles = `
    bg-bg-tertiary text-text-primary border rounded-lg px-4 py-2
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder-text-muted
  `.trim();

  const borderStyles = error
    ? 'border-error focus:border-error focus:ring-error'
    : 'border-border-primary focus:border-accent focus:ring-accent';

  const widthStyles = fullWidth ? 'w-full' : '';

  const rightPadding = rightElement ? 'pr-11' : '';
  const combinedClassName = `${baseInputStyles} ${borderStyles} ${widthStyles} ${rightPadding} ${className}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}

      <div className={rightElement ? 'relative' : undefined}>
        <input ref={ref} className={combinedClassName} {...props} />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-error">{error}</p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
