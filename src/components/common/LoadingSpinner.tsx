/**
 * Loading spinner - Cyberpunk-style animated spinner
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
}) => {
  const sizeStyles = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${sizeStyles[size]}`}>
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>

        {/* Spinning cyan arc */}
        <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>

        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        </div>
      </div>

      {message && (
        <p className="text-slate-300 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};
