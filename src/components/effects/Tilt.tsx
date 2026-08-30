import type { ReactNode } from 'react';
import { useTilt } from '../../lib/motion';

/**
 * Pointer-tracked 3D tilt with a gold sheen that follows the cursor across the
 * surface. Tilt values are written as CSS variables, so moving the pointer
 * never re-renders React.
 */
export function Tilt({
  children,
  strength = 7,
  className = '',
  sheen = true,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  sheen?: boolean;
}) {
  const { ref, onPointerMove, onPointerLeave } = useTilt<HTMLDivElement>(strength);

  return (
    <div className="[perspective:1200px]">
      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className={`tilt-surface ${className}`}
      >
        {children}
        {sheen && <span aria-hidden className="tilt-sheen" />}
      </div>
    </div>
  );
}
