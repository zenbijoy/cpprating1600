import React from 'react';
import { IconProps, IconSize, IconSemantic, IconVariant } from './types';

export function resolveIconSize(size?: IconSize): number {
  if (size === 'sm') return 16;
  if (size === 'md') return 20;
  if (size === 'lg') return 24;
  if (typeof size === 'number') return size;
  return 24; // Default token size
}

export function resolveSemanticColor(semantic?: IconSemantic): string {
  switch (semantic) {
    case 'primary':
      return 'text-[#2563EB]';
    case 'indigo':
      return 'text-[#4F46E5]';
    case 'success':
      return 'text-[#059669]';
    case 'warning':
      return 'text-[#D97706]';
    case 'error':
      return 'text-[#DC2626]';
    case 'info':
      return 'text-[#2563EB]';
    case 'secondary':
      return 'text-[#64748B]';
    case 'neutral':
      return 'text-[#0F172A] dark:text-slate-100';
    case 'inherit':
    default:
      return 'text-current';
  }
}

export function resolveVariantClass(variant?: IconVariant): string {
  switch (variant) {
    case 'hover':
      return 'transition-all duration-150 hover:brightness-125 hover:scale-105';
    case 'active':
      return 'text-[#2563EB] drop-shadow-sm scale-105';
    case 'disabled':
      return 'opacity-40 cursor-not-allowed pointer-events-none';
    case 'focus':
      return 'ring-2 ring-[#93C5FD] rounded-sm outline-none ring-offset-1 ring-offset-transparent';
    case 'default':
    default:
      return 'transition-colors duration-150';
  }
}

export interface BaseSvgProps extends IconProps {
  children: React.ReactNode;
}

export const IconBase: React.FC<BaseSvgProps> = ({
  size = 24,
  strokeWidth = 2,
  variant = 'default',
  semantic = 'inherit',
  title,
  className = '',
  children,
  style,
  ...rest
}) => {
  const pixelSize = resolveIconSize(size);
  const colorClass = resolveSemanticColor(semantic);
  const variantClass = resolveVariantClass(variant);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={pixelSize}
      height={pixelSize}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 align-middle ${colorClass} ${variantClass} ${className}`.trim()}
      style={style}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : 'presentation'}
      {...rest}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
};
