import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

/**
 * The single horizontal gutter for the whole site. Setting side padding in one
 * place is what keeps the 320px no-overflow guarantee (spec §3) enforceable.
 */
export function Container({
  children,
  className,
  width = 'default',
  as: Component = 'div',
}: {
  children: ReactNode;
  className?: string;
  width?: 'default' | 'wide' | 'narrow';
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main';
}) {
  return (
    <Component
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        width === 'narrow' && 'max-w-3xl',
        width === 'default' && 'max-w-6xl',
        width === 'wide' && 'max-w-7xl',
        className,
      )}
    >
      {children}
    </Component>
  );
}
