import { Link } from 'react-router-dom';
import type { Listing } from '../types';
import { money, pct, recoveryRate } from '../lib/format';
import { matchScore } from '../lib/ai';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { PieceImage } from './PieceImage';
import { ConditionChip, MatchBadge, RenewedTag, VerifiedSeal } from './Badges';
import { Tilt } from './effects/Tilt';

export function ItemCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const { user } = useAuth();
  const { isWatched, toggleWatch } = useStore();

  const watched = isWatched(listing.id);
  const match = user?.role === 'buyer' ? matchScore(listing, user) : 0;
  const rate = recoveryRate(listing.askingPrice, listing.retailPrice);
  const below = listing.askingPrice < listing.retailPrice;

  return (
    <Tilt className="plate group h-full overflow-hidden lift image-zoom" strength={6}>
      <article className="flex h-full flex-col">
        <Link
          to={`/piece/${listing.id}`}
          className="relative block aspect-[4/3] overflow-hidden"
          aria-label={`${listing.brand} ${listing.title}`}
        >
          <div className="h-full w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]">
            <PieceImage
              listing={listing}
              sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 92vw"
            />
          </div>

          {/* Base scrim so the overlaid type always has contrast. */}
          <div className="from-ink-950/95 via-ink-950/30 absolute inset-0 bg-gradient-to-t to-transparent" />

          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {listing.verified ? <VerifiedSeal by={listing.authenticator} compact /> : null}
            {listing.renewedFrom ? <RenewedTag /> : null}
          </div>

          <div className="absolute right-3 bottom-3">
            <ConditionChip condition={listing.condition} />
          </div>

          {match >= 55 && (
            <div className="absolute top-3 right-3 glow-gold">
              <MatchBadge score={match} />
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase shimmer-text">
                {listing.brand}
              </p>
              <h3 className="text-mist-100 group-hover:text-gold-100 mt-1.5 truncate text-lg transition-colors duration-300">
                <Link to={`/piece/${listing.id}`} className="link-gold">{listing.title}</Link>
              </h3>
            </div>

            <button
              onClick={() => toggleWatch(listing.id)}
              aria-pressed={watched}
              aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
              className={`shrink-0 rounded-full border p-2 transition-all duration-300 btn-magnetic ${
                watched
                  ? 'border-gold-400/70 bg-gold-500/18 text-gold-200 glow-gold'
                  : 'border-gold-500/18 text-mist-400 hover:border-gold-400/60 hover:text-gold-200'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={watched ? 'currentColor' : 'none'}>
                <path
                  d="M12 20.5l-1.4-1.3C5.6 14.9 2.8 12.3 2.8 8.9 2.8 6.2 5 4 7.7 4c1.6 0 3.1.7 4.3 2 1.2-1.3 2.7-2 4.3-2 2.7 0 4.9 2.2 4.9 4.9 0 3.4-2.8 6-7.8 10.3L12 20.5z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
              </svg>
            </button>
          </div>

          <p className="text-mist-400 mt-3 line-clamp-2 text-[0.8rem] leading-relaxed">
            {listing.description}
          </p>

          <div className="hairline mt-auto flex items-end justify-between gap-3 border-t pt-4">
            <div>
              <p className="text-gilded font-display text-2xl shimmer-text">{money(listing.askingPrice)}</p>
              <p className="text-mist-500 mt-1 text-[0.65rem] tracking-[0.1em]">
                {below ? (
                  <>
                    {pct(1 - rate)} under retail · {listing.location}
                  </>
                ) : (
                  <>
                    {pct(rate)} of retail · {listing.location}
                  </>
                )}
              </p>
            </div>
            <span className="text-mist-500 shrink-0 text-[0.65rem] tracking-[0.14em] uppercase">
              {listing.watchers} watching
            </span>
          </div>
        </div>

        {/* Gold sweep across the bottom edge on hover. */}
        <span
          aria-hidden
          className="bg-gilded absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100 glow-gold"
          style={{ transitionDelay: `${index * 20}ms` }}
        />
      </article>
    </Tilt>
  );
}
