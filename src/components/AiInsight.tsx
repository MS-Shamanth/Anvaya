import type { Listing, PriceGuidance, RecoveryRecommendation } from '../types';
import { inventoryHealth, priceGuidance, recoveryRecommendation } from '../lib/ai';
import { money, moneyCompact } from '../lib/format';
import { useReveal } from '../lib/motion';
import { HealthMeter } from './Badges';

/** Shared header treatment so every AI surface is visibly machine-generated. */
function AiEyebrow({ label, confidence }: { label: string; confidence?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-gold-400/85 flex items-center gap-2 text-[0.6rem] tracking-[0.26em] uppercase">
        <span className="relative flex size-1.5">
          <span className="bg-gold-300 halo-ring absolute inset-0 rounded-full" />
          <span className="bg-gold-300 relative size-1.5 rounded-full" />
        </span>
        {label}
      </p>
      {confidence && (
        <span className="border-gold-500/25 text-mist-400 rounded-full border px-2 py-0.5 text-[0.55rem] tracking-[0.16em] uppercase">
          {confidence} confidence
        </span>
      )}
    </div>
  );
}

/**
 * Price band with the current ask plotted on it. The band is drawn from the
 * model floor to the model ceiling, padded 12% either side so an ask outside
 * the band still lands on the track.
 */
export function PriceBand({
  guidance,
  askingPrice,
}: {
  guidance: PriceGuidance;
  askingPrice: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.3 });

  const span = guidance.ceiling - guidance.floor || 1;
  const lo = guidance.floor - span * 0.35;
  const hi = guidance.ceiling + span * 0.35;
  const place = (v: number) => Math.min(97, Math.max(3, ((v - lo) / (hi - lo)) * 100));

  const askPos = place(askingPrice);
  const inBand = askingPrice >= guidance.floor && askingPrice <= guidance.ceiling;

  return (
    <div ref={ref}>
      <div className="relative h-14">
        {/* Track */}
        <div className="bg-ink-950/80 border-gold-500/12 absolute top-6 h-1.5 w-full rounded-full border" />
        {/* Fair-value band */}
        <div
          className="bg-gilded absolute top-6 h-1.5 rounded-full opacity-80"
          style={{
            left: `${place(guidance.floor)}%`,
            width: shown ? `${place(guidance.ceiling) - place(guidance.floor)}%` : '0%',
            transition: 'width 1.1s cubic-bezier(0.22,1,0.36,1) 120ms',
          }}
        />
        {/* Fair-value tick */}
        <div
          className="bg-gold-100 absolute top-[1.15rem] h-4 w-0.5 rounded-full"
          style={{ left: `${place(guidance.fair)}%`, boxShadow: '0 0 10px rgba(255,242,189,0.9)' }}
        />
        {/* Current ask marker */}
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{
            left: `${askPos}%`,
            opacity: shown ? 1 : 0,
            transform: `translateX(-50%) translateY(${shown ? '0' : '-8px'})`,
            transition: 'opacity 600ms ease 700ms, transform 600ms ease 700ms',
          }}
        >
          <span
            className={`rounded-full border px-2 py-0.5 text-[0.58rem] tracking-[0.1em] whitespace-nowrap ${
              inBand
                ? 'border-verify-light/50 bg-verify-deep/85 text-verify-light'
                : 'border-urgent-light/50 bg-urgent-deep/85 text-urgent-light'
            }`}
          >
            Ask {moneyCompact(askingPrice)}
          </span>
          <span
            className={`mt-1 h-4 w-px ${inBand ? 'bg-verify-light' : 'bg-urgent-light'}`}
          />
        </div>
      </div>

      <div className="text-mist-500 mt-1 flex justify-between text-[0.62rem] tracking-[0.1em] uppercase">
        <span>Floor {moneyCompact(guidance.floor)}</span>
        <span className="text-gold-300">Fair {money(guidance.fair)}</span>
        <span>Ceiling {moneyCompact(guidance.ceiling)}</span>
      </div>
    </div>
  );
}

const ACTION_TONE: Record<RecoveryRecommendation['action'], string> = {
  promote: 'text-royal-200 border-royal-300/40 bg-royal-800/45',
  hold: 'text-verify-light border-verify-light/40 bg-verify-deep/50',
  reprice: 'text-gold-200 border-gold-400/40 bg-gold-700/20',
  route_to_renewal: 'text-urgent-light border-urgent-light/40 bg-urgent-deep/45',
};

const ACTION_LABEL: Record<RecoveryRecommendation['action'], string> = {
  promote: 'Promote',
  hold: 'Hold',
  reprice: 'Reprice',
  route_to_renewal: 'Route to renewal',
};

/**
 * The full intelligence read-out for one listing: health score, price band,
 * and the single recommended next move. Sellers get the action buttons; buyers
 * see the same numbers read-only, which is the point of a transparent exchange.
 */
export function AiInsightPanel({
  listing,
  variant = 'seller',
  onApplyPrice,
  onRouteToRenewal,
}: {
  listing: Listing;
  variant?: 'seller' | 'buyer';
  onApplyPrice?: (price: number) => void;
  onRouteToRenewal?: () => void;
}) {
  const health = inventoryHealth(listing);
  const guidance = priceGuidance(listing);
  const recommendation = recoveryRecommendation(listing);

  return (
    <div className="plate overflow-hidden">
      <div className="border-gold-500/12 flex flex-col gap-5 border-b p-6 sm:flex-row sm:items-center sm:gap-8">
        <HealthMeter health={health} />
        <div className="min-w-0 flex-1">
          <AiEyebrow label="AI inventory health" />
          <ul className="mt-3 space-y-1.5">
            {health.drivers.map((driver) => (
              <li key={driver} className="text-mist-300 flex gap-2 text-[0.78rem] leading-relaxed">
                <span className="text-gold-500/70 mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                {driver}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-gold-500/12 border-b p-6">
        <AiEyebrow label="Demand & price intelligence" confidence={guidance.confidence} />
        <div className="mt-5">
          <PriceBand guidance={guidance} askingPrice={listing.askingPrice} />
        </div>
        <ul className="mt-5 space-y-1.5">
          {guidance.rationale.map((line) => (
            <li key={line} className="text-mist-400 flex gap-2 text-[0.76rem] leading-relaxed">
              <span className="text-gold-500/60 mt-1.5 size-1 shrink-0 rounded-full bg-current" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-6">
        <AiEyebrow label="Recovery recommendation" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1 text-[0.62rem] tracking-[0.18em] uppercase ${ACTION_TONE[recommendation.action]}`}
          >
            {ACTION_LABEL[recommendation.action]}
          </span>
          <h4 className="text-mist-100 text-lg">{recommendation.headline}</h4>
        </div>
        <p className="text-mist-300 mt-3 text-[0.83rem] leading-relaxed">{recommendation.detail}</p>

        {variant === 'seller' && (
          <div className="mt-5 flex flex-wrap gap-3">
            {recommendation.suggestedPrice && onApplyPrice && (
              <button
                onClick={() => onApplyPrice(recommendation.suggestedPrice!)}
                className="btn-gold rounded-full px-4 py-2 text-[0.68rem] font-semibold tracking-[0.16em] uppercase"
              >
                Apply {money(recommendation.suggestedPrice)}
              </button>
            )}
            {recommendation.action === 'route_to_renewal' && onRouteToRenewal && (
              <button
                onClick={onRouteToRenewal}
                className="btn-ghost rounded-full px-4 py-2 text-[0.68rem] tracking-[0.16em] uppercase"
              >
                Send to renewal pool
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact stat tile used across the three dashboards. */
export function StatCard({
  label,
  value,
  sub,
  accent = 'gold',
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: 'gold' | 'royal' | 'verify' | 'urgent';
}) {
  const tone = {
    gold: 'text-gilded',
    royal: 'text-royal-200',
    verify: 'text-verify-light',
    urgent: 'text-urgent-light',
  }[accent];

  return (
    <div className="plate lift group relative overflow-hidden p-5">
      <p className="text-mist-500 text-[0.6rem] tracking-[0.22em] uppercase">{label}</p>
      <p className={`font-display mt-2.5 text-3xl leading-none ${tone}`}>{value}</p>
      {sub && <p className="text-mist-400 mt-2 text-[0.72rem]">{sub}</p>}
      <span
        aria-hidden
        className="bg-gilded absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-700 group-hover:scale-x-100"
      />
    </div>
  );
}
