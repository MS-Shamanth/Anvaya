import type { Condition, HealthBand, InventoryHealth, ListingStatus } from '../types';
import { useReveal } from '../lib/motion';

/* -------------------------------------------------------------------------- */
/* Verification                                                               */
/* -------------------------------------------------------------------------- */

/** Emerald is reserved for trust, so a verified piece is recognisable at a glance. */
export function VerifiedSeal({
  by,
  compact = false,
}: {
  by?: string;
  compact?: boolean;
}) {
  return (
    <span
      title={by ? `Authenticated by ${by}` : 'Authenticated by Anvaya'}
      className="border-verify-light/35 bg-verify-deep/70 text-verify-light inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] tracking-[0.16em] uppercase backdrop-blur-sm"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2l7 3v6c0 5-3 8.5-7 11-4-2.5-7-6-7-11V5l7-3z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M8.5 12l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {compact ? 'Verified' : 'Authenticated'}
    </span>
  );
}

export function UnverifiedTag() {
  return (
    <span className="border-mist-500/40 bg-ink-950/60 text-mist-400 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] tracking-[0.16em] uppercase">
      Pending authentication
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Condition + status                                                         */
/* -------------------------------------------------------------------------- */

const CONDITION_TONE: Record<Condition, string> = {
  Unworn: 'border-gold-300/50 text-gold-100 bg-gold-500/12',
  Pristine: 'border-gold-400/40 text-gold-200 bg-gold-600/10',
  Excellent: 'border-royal-300/40 text-royal-200 bg-royal-700/25',
  Good: 'border-mist-400/35 text-mist-200 bg-ink-700/50',
  Restorable: 'border-urgent-light/40 text-urgent-light bg-urgent-deep/40',
};

export function ConditionChip({ condition }: { condition: Condition }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[0.6rem] tracking-[0.16em] uppercase ${CONDITION_TONE[condition]}`}
    >
      {condition}
    </span>
  );
}

const STATUS_COPY: Record<ListingStatus, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'border-mist-500/40 text-mist-400 bg-ink-800/60' },
  live: { label: 'Live', tone: 'border-verify-light/40 text-verify-light bg-verify-deep/50' },
  sold: { label: 'Sold', tone: 'border-royal-300/40 text-royal-200 bg-royal-800/50' },
  renewal_pool: {
    label: 'In renewal pool',
    tone: 'border-gold-400/45 text-gold-200 bg-gold-700/18',
  },
  in_renewal: { label: 'With atelier', tone: 'border-gold-300/40 text-gold-100 bg-gold-600/16' },
  archived: { label: 'Archived', tone: 'border-mist-500/30 text-mist-500 bg-ink-950/70' },
};

export function StatusPill({ status }: { status: ListingStatus }) {
  const { label, tone } = STATUS_COPY[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] tracking-[0.16em] uppercase ${tone}`}
    >
      {status === 'live' && <span className="pulse-dot size-1 rounded-full bg-current" />}
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Health gauge                                                               */
/* -------------------------------------------------------------------------- */

export const BAND_COLOR: Record<HealthBand, string> = {
  strong: '#4CC79B',
  steady: '#E9C37A',
  at_risk: '#D9B45F',
  critical: '#E4794F',
};

const BAND_TEXT: Record<HealthBand, string> = {
  strong: 'text-verify-light',
  steady: 'text-gold-200',
  at_risk: 'text-gold-400',
  critical: 'text-urgent-light',
};

/** Circular gauge that draws itself in when it enters the viewport. */
export function HealthMeter({
  health,
  size = 92,
  showLabel = true,
}: {
  health: InventoryHealth;
  size?: number;
  showLabel?: boolean;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.3 });
  const stroke = size >= 80 ? 5 : 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = shown ? (health.score / 100) * circumference : 0;
  const color = BAND_COLOR[health.band];

  return (
    <div ref={ref} className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(201,162,75,0.14)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference - filled}
            style={{
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)',
              filter: `drop-shadow(0 0 6px ${color}66)`,
            }}
          />
        </svg>
        <span
          className="absolute inset-0 flex flex-col items-center justify-center"
          role="img"
          aria-label={`Inventory health ${health.score} of 100, ${health.label}`}
        >
          <span
            className="font-display leading-none"
            style={{ color, fontSize: size * 0.31 }}
          >
            {health.score}
          </span>
          {size >= 80 && (
            <span className="text-mist-500 mt-0.5 text-[0.48rem] tracking-[0.2em] uppercase">
              health
            </span>
          )}
        </span>
      </div>
      {showLabel && (
        <div>
          <p className={`text-sm font-medium ${BAND_TEXT[health.band]}`}>{health.label}</p>
          <p className="text-mist-500 text-[0.65rem] tracking-[0.14em] uppercase">AI risk score</p>
        </div>
      )}
    </div>
  );
}

/** Slim inline health bar for dense tables. */
export function HealthBar({ health }: { health: InventoryHealth }) {
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.2 });
  const color = BAND_COLOR[health.band];
  return (
    <div ref={ref} className="flex items-center gap-2.5">
      <div className="bg-ink-950/80 border-gold-500/12 h-1.5 w-20 overflow-hidden rounded-full border">
        <div
          className="h-full rounded-full"
          style={{
            width: shown ? `${health.score}%` : '0%',
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}99`,
            transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>
      <span className="tabular-nums text-xs" style={{ color }}>
        {health.score}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Buyer matching                                                            */
/* -------------------------------------------------------------------------- */

export function MatchBadge({ score }: { score: number }) {
  if (score < 55) return null;
  return (
    <span className="border-royal-300/45 bg-royal-800/70 text-royal-200 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] tracking-[0.14em] uppercase backdrop-blur-sm">
      <span className="bg-royal-300 pulse-dot size-1 rounded-full" />
      {score}% match
    </span>
  );
}

/** Marks pieces that came back through an atelier. */
export function RenewedTag() {
  return (
    <span className="border-gold-300/50 bg-gold-700/25 text-gold-100 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6rem] tracking-[0.16em] uppercase backdrop-blur-sm">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 12a8 8 0 0113.7-5.6M20 12a8 8 0 01-13.7 5.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M17 3v4h-4M7 21v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Renewed
    </span>
  );
}
