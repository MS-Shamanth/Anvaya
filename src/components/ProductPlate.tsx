import type { Category } from '../types';
import { seededUnit } from '../lib/ai';

/**
 * Generated product art.
 *
 * Real catalogue photography arrives with seller uploads. Until then every
 * listing gets a deterministic, on-brand plate: a navy field lit from one
 * corner, a gilded line-art glyph for the category, and the brand initial set
 * as a watermark. Derived from the listing id, so a piece always looks the
 * same, and it never depends on an external image host.
 */

function Glyph({ category }: { category: Category }) {
  const common = {
    fill: 'none',
    stroke: 'url(#plate-gold)',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (category) {
    case 'Watches':
      return (
        <g {...common}>
          <circle cx="100" cy="100" r="42" strokeWidth="1.6" />
          <circle cx="100" cy="100" r="34" strokeWidth="0.7" opacity="0.6" />
          <path d="M100 76 L100 100 L118 110" strokeWidth="2" />
          <path d="M86 58 L88 46 L112 46 L114 58" strokeWidth="1.4" />
          <path d="M86 142 L88 154 L112 154 L114 142" strokeWidth="1.4" />
          <circle cx="100" cy="100" r="2.4" fill="url(#plate-gold)" stroke="none" />
        </g>
      );
    case 'Handbags':
      return (
        <g {...common}>
          <path d="M64 84 L136 84 L128 148 L72 148 Z" strokeWidth="1.6" />
          <path d="M82 84 C82 58, 118 58, 118 84" strokeWidth="1.6" />
          <path d="M64 100 L136 100" strokeWidth="0.7" opacity="0.55" />
          <rect x="93" y="96" width="14" height="11" rx="2" strokeWidth="1.3" />
        </g>
      );
    case 'Jewellery':
      return (
        <g {...common}>
          <path d="M100 54 L142 92 L100 150 L58 92 Z" strokeWidth="1.6" />
          <path d="M58 92 L142 92" strokeWidth="0.9" opacity="0.7" />
          <path d="M78 92 L100 54 L122 92 L100 150 Z" strokeWidth="0.7" opacity="0.6" />
          <path d="M78 92 L122 92" strokeWidth="0.5" opacity="0.4" />
        </g>
      );
    case 'Couture':
      return (
        <g {...common}>
          <path d="M100 48 C94 48, 94 56, 100 58" strokeWidth="1.3" />
          <path d="M70 70 L100 58 L130 70" strokeWidth="1.5" />
          <path d="M84 70 C74 100, 62 128, 58 152 L142 152 C138 128, 126 100, 116 70" strokeWidth="1.6" />
          <path d="M92 74 C88 104, 86 130, 86 152" strokeWidth="0.6" opacity="0.5" />
          <path d="M108 74 C112 104, 114 130, 114 152" strokeWidth="0.6" opacity="0.5" />
        </g>
      );
    case 'Footwear':
      return (
        <g {...common}>
          <path d="M56 128 C74 128, 96 118, 112 96 C120 84, 128 74, 138 70 L142 78 C132 92, 128 108, 128 128 Z" strokeWidth="1.6" />
          <path d="M128 128 L132 152 L120 152 L120 128" strokeWidth="1.5" />
          <path d="M56 128 L56 136 L120 136" strokeWidth="1.2" opacity="0.7" />
        </g>
      );
    case 'Eyewear':
      return (
        <g {...common}>
          <circle cx="74" cy="102" r="22" strokeWidth="1.6" />
          <circle cx="126" cy="102" r="22" strokeWidth="1.6" />
          <path d="M96 98 C100 92, 100 92, 104 98" strokeWidth="1.5" />
          <path d="M52 96 L38 88" strokeWidth="1.4" />
          <path d="M148 96 L162 88" strokeWidth="1.4" />
        </g>
      );
    case 'Objet':
      return (
        <g {...common}>
          <path d="M84 52 L116 52 L112 76 C126 86, 132 104, 132 122 C132 142, 118 152, 100 152 C82 152, 68 142, 68 122 C68 104, 74 86, 88 76 Z" strokeWidth="1.6" />
          <path d="M76 112 C88 106, 112 106, 124 112" strokeWidth="0.7" opacity="0.55" />
          <path d="M88 52 L88 40 L112 40 L112 52" strokeWidth="1.2" opacity="0.8" />
        </g>
      );
    default:
      return null;
  }
}

export function ProductPlate({
  id,
  brand,
  category,
  className = '',
  glow = true,
}: {
  id: string;
  brand: string;
  category: Category;
  className?: string;
  glow?: boolean;
}) {
  const unit = seededUnit(id);
  const angle = Math.round(120 + unit * 130);
  const lightX = 18 + Math.round(unit * 64);
  const hueA = ['#16224A', '#1E2E5E', '#10275F', '#0B1B47', '#0A1330'][
    Math.floor(unit * 5) % 5
  ]!;
  const gid = `p-${id}`;

  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={`block h-full w-full ${className}`}
    >
      <defs>
        <linearGradient id={`${gid}-field`} gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={hueA} />
          <stop offset="58%" stopColor="#0A1330" />
          <stop offset="100%" stopColor="#04070F" />
        </linearGradient>
        <radialGradient id={`${gid}-light`} cx={`${lightX}%`} cy="16%" r="72%">
          <stop offset="0%" stopColor="#3B6FD0" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#1D4392" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#04070F" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="plate-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A6A28" />
          <stop offset="30%" stopColor="#E9C37A" />
          <stop offset="52%" stopColor="#FFF2BD" />
          <stop offset="76%" stopColor="#C9A24B" />
          <stop offset="100%" stopColor="#6B4A18" />
        </linearGradient>
      </defs>

      <rect width="200" height="200" fill={`url(#${gid}-field)`} />
      <rect width="200" height="200" fill={`url(#${gid}-light)`} />

      {/* Concentric arcs, offset by the seed so no two plates line up. */}
      <g stroke="url(#plate-gold)" fill="none" opacity="0.14">
        <circle cx={200 - lightX} cy={30 + unit * 40} r="86" strokeWidth="0.6" />
        <circle cx={200 - lightX} cy={30 + unit * 40} r="122" strokeWidth="0.5" />
        <circle cx={200 - lightX} cy={30 + unit * 40} r="158" strokeWidth="0.4" />
      </g>

      {/* Brand initial, set very large and very quiet. */}
      <text
        x="100"
        y="132"
        textAnchor="middle"
        fontFamily="Cormorant Garamond, Georgia, serif"
        fontSize="132"
        fill="#FFF2BD"
        opacity="0.05"
      >
        {brand.charAt(0)}
      </text>

      <g className={glow ? 'plate-glyph' : undefined}>
        <Glyph category={category} />
      </g>

      {/* Inner gold frame. */}
      <rect
        x="10"
        y="10"
        width="180"
        height="180"
        fill="none"
        stroke="url(#plate-gold)"
        strokeWidth="0.6"
        opacity="0.3"
      />
    </svg>
  );
}
