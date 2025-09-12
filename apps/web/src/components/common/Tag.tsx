
import React from 'react';

interface TagProps {
  label: string;
  color?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Tag: React.FC<TagProps> = ({ label, color, size, onClick }) => {
  const baseClasses = 'badge';
  const colorClasses = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    accent: 'badge-accent',
    ghost: 'badge-ghost',
  };
  const sizeClasses = {
    xs: 'badge-xs',
    sm: 'badge-sm',
    md: 'badge-md',
    lg: 'badge-lg',
  };

  const classes = [
    baseClasses,
    color ? colorClasses[color] : '',
    size ? sizeClasses[size] : '',
    onClick ? 'cursor-pointer hover:opacity-80' : ''
  ].join(' ').trim();

  return (
    <div className={classes} onClick={onClick}>
      {label}
    </div>
  );
};

export default Tag;
