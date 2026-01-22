/**
 * Input component - Text input with validation states
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseInputStyles = 'bg-slate-700 text-white border rounded-lg px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const borderStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500';

  const widthStyles = fullWidth ? 'w-full' : '';

  const combinedClassName = `${baseInputStyles} ${borderStyles} ${widthStyles} ${className}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}

      <input className={combinedClassName} {...props} />

      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-400">{helperText}</p>
      )}
    </div>
  );
};
