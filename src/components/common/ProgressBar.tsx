/**
 * Progress bar component - Horizontal progress indicator
 */

import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'green' | 'red' | 'yellow';
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = true,
  label,
  size = 'md',
  color = 'cyan',
  animated = false,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const heightStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorStyles = {
    cyan: 'bg-cyan-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };

  const animationStyles = animated ? 'transition-all duration-300 ease-out' : '';

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-secondary">
            {label || `${Math.round(percentage)}%`}
          </span>
          {label && showLabel && (
            <span className="text-sm text-text-muted">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div className={`w-full bg-bg-tertiary rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`${heightStyles[size]} ${colorStyles[color]} ${animationStyles} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
