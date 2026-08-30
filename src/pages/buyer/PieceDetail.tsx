import { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { quoteFor, useStore } from '../../context/StoreContext';
import { matchScore } from '../../lib/ai';
import { money, pct, recoveryRate, relativeDays, shortDate } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { PieceImage, imageFor } from '../../components/PieceImage';
import { creditFor } from '../../data/images';
import {
  ConditionChip,
  MatchBadge,
  RenewedTag,
  StatusPill,
  UnverifiedTag,
  VerifiedSeal,
} from '../../components/Badges';
import { AiInsightPanel } from '../../components/AiInsight';
import { Button, ButtonLink, EmptyState, Panel } from '../../components/ui';
import { ItemCard } from '../../components/ItemCard';
import { Reveal } from '../../components/effects/Reveal';
import { Tilt } from '../../components/effects/Tilt';
import { GoldDust } from '../../components/effects/GoldDust';

export default function PieceDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user, userById } = useAuth();
  const { listingById, liveListings, isWatched, toggleWatch, recordView } = useStore();

  const listing = listingById(id);
  const viewed = useRef<string | null>(null);

  useEffect(() => {
    if (!listing || viewed.current === listing.id) return;
    viewed.current = listing.id;
    recordView(listing.id);
    // recordView is intentionally omitted: it changes identity on every store
    // update, and the ref guard already limits this to once per piece.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (!listing) {
    return (
      <AppShell>
        <EmptyState
          title="This piece is no longer on the exchange"
          body="It may have sold, been withdrawn, or gone to an atelier for renewal."
          action={<ButtonLink to="/browse" variant="gold">Back to the exchange</ButtonLink>}
        />
      </AppShell>
    );
  }

  const seller = userById(listing.sellerId);
  const credit = creditFor(imageFor(listing));
  const origin = listing.renewedFrom ? listingById(listing.renewedFrom) : undefined;
  const quote = quoteFor(listing);
  const watched = isWatched(listing.id);
  const match = user?.role === 'buyer' ? matchScore(listing, user) : 0;
  const rate = recoveryRate(listing.askingPrice, listing.retailPrice);
  const isBuyer = user?.role === 'buyer';
  const available = listing.status === 'live';

  const similar = liveListings
    .filter((l) => l.id !== listing.id && (l.category === listing.category || l.brand === listing.brand))
    .slice(0, 4);

  return (
    <AppShell>
      <Reveal>
        <nav className="text-mist-500 flex items-center gap-2 text-[0.68rem] tracking-[0.14em] uppercase">
          <Link to="/browse" className="link-gold hover:text-gold-300">
            Exchange
          </Link>
          <span>/</span>
          <span className="text-mist-400">{listing.category}</span>
          <span>/</span>
          <span className="text-gold-300">{listing.sku}</span>
        </nav>
      </Reveal>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_1fr] xl:gap-14">
        {/* ------------------------------- artwork ------------------------------- */}
        <Reveal direction="right">
          <div className="sticky top-32">
            <Tilt className="plate overflow-hidden" strength={5}>
              <div className="relative aspect-square">
                <PieceImage listing={listing} eager sizes="(min-width: 1024px) 48vw, 92vw" />
                <GoldDust density={0.45} />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  {listing.verified ? <VerifiedSeal by={listing.authenticator} /> : <UnverifiedTag />}
                  {listing.renewedFrom && <RenewedTag />}
                </div>
                <div className="absolute right-4 bottom-4 flex flex-wrap justify-end gap-2">
                  <ConditionChip condition={listing.condition} />
                  {!available && <StatusPill status={listing.status} />}
                </div>
              </div>
            </Tilt>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { k: 'Year', v: String(listing.year) },
                { k: 'Views', v: listing.views.toLocaleString('en-IN') },
                { k: 'Watching', v: String(listing.watchers) },
              ].map((cell) => (
                <div key={cell.k} className="plate px-4 py-3 text-center">
                  <p className="text-mist-500 text-[0.55rem] tracking-[0.2em] uppercase">{cell.k}</p>
                  <p className="text-gold-200 font-display mt-1 text-lg">{cell.v}</p>
                </div>
              ))}
            </div>

            {/* Attribution for the openly licensed stand-in photography. */}
            {credit && (
              <p className="text-mist-500 mt-3 text-[0.62rem] leading-relaxed">
                Stand-in photograph ·{' '}
                <a
                  href={credit.source}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-gold text-mist-400 hover:text-gold-300"
                >
                  {credit.creator}
                </a>{' '}
                · {credit.license} via {credit.origin}
              </p>
            )}
          </div>
        </Reveal>

        {/* -------------------------------- detail ------------------------------- */}
        <div className="space-y-8">
          <Reveal direction="left">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-gold-400/85 text-[0.62rem] tracking-[0.3em] uppercase">
                  {listing.brand}
                </p>
                {match >= 55 && <MatchBadge score={match} />}
              </div>
              <h1 className="text-mist-100 mt-3 text-4xl leading-tight sm:text-5xl">
                {listing.title}
              </h1>
              <p className="text-mist-400 mt-4 text-[0.9rem] leading-relaxed">
                {listing.description}
              </p>

              <div className="border-gold-500/12 mt-7 flex flex-wrap items-end gap-x-8 gap-y-4 border-t pt-7">
                <div>
                  <p className="text-mist-500 text-[0.58rem] tracking-[0.2em] uppercase">Asking</p>
                  <p className="text-gilded font-display mt-1.5 text-4xl">
                    {money(listing.askingPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-mist-500 text-[0.58rem] tracking-[0.2em] uppercase">
                    Original retail
                  </p>
                  <p className="text-mist-300 font-display mt-1.5 text-2xl line-through decoration-1">
                    {money(listing.retailPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-mist-500 text-[0.58rem] tracking-[0.2em] uppercase">
                    {listing.askingPrice < listing.retailPrice ? 'Below retail' : 'Of retail'}
                  </p>
                  <p
                    className={`font-display mt-1.5 text-2xl ${
                      listing.askingPrice < listing.retailPrice
                        ? 'text-verify-light'
                        : 'text-gold-300'
                    }`}
                  >
                    {listing.askingPrice < listing.retailPrice ? pct(1 - rate) : pct(rate)}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {isBuyer && available && (
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={() => navigate(`/checkout/${listing.id}`)}
                  >
                    Acquire · {money(quote.total)}
                  </Button>
                )}
                {!isBuyer && available && (
                  <ButtonLink to="/enter" variant="gold" size="lg">
                    Sign in as a buyer to acquire
                  </ButtonLink>
                )}
                {!available && (
                  <span className="border-mist-500/30 bg-ink-900/60 text-mist-400 rounded-full border px-6 py-4 text-[0.72rem] tracking-[0.18em] uppercase">
                    Not currently available
                  </span>
                )}
                <Button variant="ghost" size="lg" onClick={() => toggleWatch(listing.id)}>
                  {watched ? 'Watching' : 'Watch this piece'}
                </Button>
              </div>

              {available && (
                <p className="text-mist-500 mt-4 text-[0.7rem] leading-relaxed">
                  {money(listing.askingPrice)} to the seller · {money(quote.fee)} escrow and
                  authentication · {money(quote.shipping)} insured delivery
                </p>
              )}
            </div>
          </Reveal>

          {/* Provenance for renewed pieces */}
          {listing.renewalSummary && (
            <Reveal direction="left" delay={90}>
              <Panel className="p-6">
                <p className="text-gold-300 flex items-center gap-2 text-[0.6rem] tracking-[0.26em] uppercase">
                  <span className="bg-gold-300 pulse-dot size-1.5 rounded-full" />
                  Renewal provenance
                </p>
                <p className="text-mist-200 mt-4 text-[0.86rem] leading-relaxed">
                  {listing.renewalSummary}
                </p>
                {listing.renewedBy && (
                  <p className="text-mist-400 mt-4 text-[0.76rem]">
                    Renewed by{' '}
                    <span className="text-gold-200">{userById(listing.renewedBy)?.org}</span>
                    {origin && (
                      <>
                        {' '}
                        · originally listed by {userById(origin.sellerId)?.org} at{' '}
                        {money(origin.askingPrice)}
                      </>
                    )}
                  </p>
                )}
              </Panel>
            </Reveal>
          )}

          {/* Specification */}
          <Reveal direction="left" delay={140}>
            <Panel className="p-6">
              <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">
                Specification
              </p>
              <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {[
                  { k: 'Reference', v: listing.sku },
                  { k: 'Condition', v: listing.condition },
                  { k: 'Year', v: String(listing.year) },
                  { k: 'Materials', v: listing.materials },
                  { k: 'Located in', v: listing.location },
                  { k: 'Listed', v: `${shortDate(listing.listedAt)} · ${relativeDays(listing.listedAt)}` },
                ].map((row) => (
                  <div key={row.k}>
                    <dt className="text-mist-500 text-[0.58rem] tracking-[0.2em] uppercase">
                      {row.k}
                    </dt>
                    <dd className="text-mist-200 mt-1 text-[0.84rem]">{row.v}</dd>
                  </div>
                ))}
              </dl>

              <div className="border-gold-500/12 mt-6 border-t pt-5">
                <dt className="text-mist-500 text-[0.58rem] tracking-[0.2em] uppercase">
                  Included
                </dt>
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.includes.map((item) => (
                    <span
                      key={item}
                      className="border-gold-500/18 text-mist-300 rounded-full border px-3 py-1 text-[0.7rem]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Panel>
          </Reveal>

          {/* Seller */}
          {seller && (
            <Reveal direction="left" delay={190}>
              <Panel className="flex items-center gap-4 p-6">
                <span className="bg-gilded text-ink-950 flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {seller.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-mist-100 text-[0.92rem]">{seller.org}</p>
                  <p className="text-mist-500 mt-0.5 text-[0.72rem]">
                    {seller.name} · {seller.standing} standing · on Anvaya since{' '}
                    {new Date(seller.memberSince).getFullYear()}
                  </p>
                </div>
                {listing.verified && <VerifiedSeal by={listing.authenticator} compact />}
              </Panel>
            </Reveal>
          )}

          {/* AI panel — buyers see the same numbers, read-only */}
          <Reveal direction="left" delay={240}>
            <AiInsightPanel listing={listing} variant="buyer" />
          </Reveal>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <h2 className="text-mist-100 text-3xl">In the same vein</h2>
            <p className="text-mist-400 mt-2 text-sm">
              Other {listing.category.toLowerCase()} and {listing.brand} pieces on the exchange.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item, i) => (
              <Reveal key={item.id} delay={i * 90}>
                <ItemCard listing={item} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
