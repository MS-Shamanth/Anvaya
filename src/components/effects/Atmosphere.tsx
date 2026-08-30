import { useScrollProgress } from '../../lib/motion';

/** Film-grain overlay. Keeps the flat gradients from looking synthetic. */
export function Grain() {
  return (
    <div aria-hidden className="grain-overlay">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <filter id="anvaya-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#anvaya-grain)" />
      </svg>
    </div>
  );
}

/** Warm gold halo that trails the cursor, fed by usePointerBeacon's CSS vars. */
export function Spotlight() {
  return <div aria-hidden className="cursor-spotlight" />;
}

/** Thin gilded reading-progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const progress = useScrollProgress();
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent">
      <div
        className="bg-gilded h-full origin-left transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%`, boxShadow: '0 0 12px rgba(233,195,122,0.85)' }}
      />
    </div>
  );
}

/**
 * Gold hairline with a four-point star at its centre — the flourish that sits
 * under the wordmark in the logo.
 */
export function Divider({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="rule-gold h-px flex-1" />
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        className="text-gold-300 shrink-0 drop-shadow-[0_0_6px_rgba(233,195,122,0.85)]"
      >
        <path
          d="M12 0.5 C12.9 7.4 16.6 11.1 23.5 12 C16.6 12.9 12.9 16.6 12 23.5 C11.1 16.6 7.4 12.9 0.5 12 C7.4 11.1 11.1 7.4 12 0.5 Z"
          fill="currentColor"
        />
      </svg>
      <span className="rule-gold h-px flex-1" />
    </div>
  );
}
