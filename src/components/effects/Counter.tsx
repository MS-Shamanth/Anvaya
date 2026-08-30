import { useCountUp } from '../../lib/motion';

/** Number that rolls up to its target the moment it scrolls into view. */
export function Counter({
  to,
  format,
  duration = 1600,
  className = '',
}: {
  to: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}) {
  const { ref, value } = useCountUp(to, duration);
  const render = format ?? ((v: number) => Math.round(v).toLocaleString('en-IN'));
  return (
    <span ref={ref} className={className}>
      {render(value)}
    </span>
  );
}
