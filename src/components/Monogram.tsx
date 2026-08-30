/**
 * The Anvaya mark, redrawn as SVG so it can be gilded, animated, and scaled
 * without shipping a raster. Colours match the Logo.jpeg gold ramp.
 */
export function Monogram({
  size = 44,
  animate = true,
  ring = true,
  className = '',
}: {
  size?: number;
  animate?: boolean;
  ring?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Anvaya"
      className={className}
    >
      <defs>
        <linearGradient id="anvaya-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A6A28" />
          <stop offset="28%" stopColor="#E9C37A" />
          <stop offset="50%" stopColor="#FFF2BD" />
          <stop offset="72%" stopColor="#D9B45F" />
          <stop offset="100%" stopColor="#8A6A28" />
        </linearGradient>
        <radialGradient id="anvaya-core" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#1E2E5E" />
          <stop offset="70%" stopColor="#0A1330" />
          <stop offset="100%" stopColor="#04070F" />
        </radialGradient>
        <filter id="anvaya-bloom" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="50" cy="50" r="49" fill="url(#anvaya-core)" />

      {ring && (
        <>
          <circle
            cx="50"
            cy="50"
            r="45.5"
            fill="none"
            stroke="url(#anvaya-gold)"
            strokeWidth="1"
            opacity="0.55"
          />
          <circle
            cx="50"
            cy="50"
            r="41"
            fill="none"
            stroke="url(#anvaya-gold)"
            strokeWidth="0.7"
            strokeDasharray="1.5 5"
            opacity="0.7"
            className={animate ? 'monogram-ring' : undefined}
            style={{ transformOrigin: '50px 50px' }}
          />
        </>
      )}

      {/*
        The mark is an A and a V sharing one stroke: the A's right leg keeps
        going past the baseline to become the V's left arm, then rises to a flat
        serif at the top right. The A's crossbar is a swash that sweeps up from
        the left leg and crosses the shared stroke. Coordinates are traced from
        Logo.jpeg. Paths carry pathLength="100" so the draw-on animation
        advances at the same rate regardless of each path's real length.
      */}
      <g
        fill="none"
        stroke="url(#anvaya-gold)"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#anvaya-bloom)"
        className={animate ? 'monogram-draw' : undefined}
      >
        {/* A — left leg, down into the flared foot */}
        <path d="M46 13 L16.8 79.2" strokeWidth="3.4" pathLength="100" />

        {/* A right leg continuing into the V, then up to its terminal */}
        <path d="M46 13 L69 90 L85.5 43" strokeWidth="2.9" pathLength="100" />

        {/* Wide bracket serif under the A's left foot */}
        <path d="M9.5 81 C14.5 77.8 19.5 77.8 24.5 81" strokeWidth="1.5" pathLength="100" />

        {/* Flat serif capping the V's right arm */}
        <path d="M79 42.5 L91.5 42.5" strokeWidth="1.6" pathLength="100" />

        {/* The swash standing in for the A's crossbar: shallow dip, then a
            steep sweep up across the shared stroke, ending in a point. */}
        <path d="M28.6 50 C39 60.5, 54 57.5, 64 38" strokeWidth="2.6" pathLength="100" />
      </g>
    </svg>
  );
}

/** Full lockup: mark plus wordmark, used in the nav and on the landing hero. */
export function Wordmark({
  size = 'md',
  animate = true,
  tagline = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  tagline?: boolean;
}) {
  const scale = { sm: 30, md: 42, lg: 76 }[size];
  const type = {
    sm: 'text-lg tracking-[0.42em]',
    md: 'text-2xl tracking-[0.44em]',
    lg: 'text-5xl tracking-[0.4em] sm:text-6xl',
  }[size];

  return (
    <span className="flex items-center gap-3">
      <Monogram size={scale} animate={animate} />
      <span className="flex flex-col leading-none">
        <span className={`text-gilded font-display ${type} pl-1 font-medium`}>ANVAYA</span>
        {tagline && (
          <span className="text-mist-400 mt-1.5 pl-1 text-[0.55rem] tracking-[0.3em] uppercase">
            Premium Exchange
          </span>
        )}
      </span>
    </span>
  );
}
