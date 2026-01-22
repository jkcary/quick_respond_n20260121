/**
 * Select dropdown component
 */

import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseSelectStyles = 'bg-slate-700 text-white border rounded-lg px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer';

  const borderStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-slate-600 focus:border-cyan-500 focus:ring-cyan-500';

  const widthStyles = fullWidth ? 'w-full' : '';

  const combinedClassName = `${baseSelectStyles} ${borderStyles} ${widthStyles} ${className}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <select className={combinedClassName} {...props}>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown arrow icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-400">{helperText}</p>
      )}
    </div>
  );
};
