/**
 * Card component - Slate-800 background with optional glow effect
 */

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = false,
  onClick,
  hoverable = false,
}) => {
  const baseStyles = 'bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg';

  const glowStyles = glow ? 'ring-2 ring-cyan-500/50' : '';

  const hoverStyles = hoverable || onClick ? 'hover:bg-slate-750 hover:border-slate-600 cursor-pointer transition-all duration-200' : '';

  const combinedClassName = `${baseStyles} ${glowStyles} ${hoverStyles} ${className}`;

  return (
    <div className={combinedClassName} onClick={onClick}>
      {children}
    </div>
  );
};
