/**
 * Card component - Theme-aware with optional glow effect
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
  const baseStyles = 'bg-bg-secondary border border-border-primary rounded-2xl p-6 shadow-card transition-all duration-200';

  const glowStyles = glow ? 'ring-2 ring-accent/50 shadow-glow' : '';

  const hoverStyles = hoverable || onClick
    ? 'hover:bg-bg-tertiary/50 hover:border-border-secondary hover:shadow-card-hover cursor-pointer'
    : '';

  const combinedClassName = `${baseStyles} ${glowStyles} ${hoverStyles} ${className}`;

  return (
    <div className={combinedClassName} onClick={onClick}>
      {children}
    </div>
  );
};
