import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { inventoryHealth, recoveryRecommendation } from '../../lib/ai';
import { daysSince, money, moneyCompact, pct, recoveryRate } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { PieceImage } from '../../components/PieceImage';
import { HealthBar, HealthMeter, StatusPill } from '../../components/Badges';
import { StatCard } from '../../components/AiInsight';
import { ButtonLink, EmptyState, Panel, SectionHeading } from '../../components/ui';
import { Reveal, RevealWords } from '../../components/effects/Reveal';
import { Counter } from '../../components/effects/Counter';
import { Tilt } from '../../components/effects/Tilt';

const ACTION_TONE: Record<string, string> = {
  promote: 'text-royal-200',
  hold: 'text-verify-light',
  reprice: 'text-gold-200',
  route_to_renewal: 'text-urgent-light',
};

function ActionCard({ listing, index }: { listing: Listing; index: number }) {
  const health = inventoryHealth(listing);
  const recommendation = recoveryRecommendation(listing);

  return (
    <Reveal delay={index * 110}>
      <Tilt className="plate h-full p-6" strength={5}>
        <Link to={`/seller/piece/${listing.id}`} className="flex h-full flex-col">
          <div className="flex items-start gap-4">
            <div className="border-gold-500/15 size-16 shrink-0 overflow-hidden rounded-lg border">
              <PieceImage listing={listing} glow={false} sizes="4rem" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gold-400/85 text-[0.56rem] tracking-[0.24em] uppercase">
                {listing.brand}
              </p>
              <h3 className="text-mist-100 mt-1 truncate text-[0.95rem]">{listing.title}</h3>
              <p className="text-mist-500 mt-1 text-[0.68rem]">
                {money(listing.askingPrice)} · {daysSince(listing.listedAt)} days live
              </p>
            </div>
            <HealthMeter health={health} size={54} showLabel={false} />
          </div>

          <p
            className={`mt-5 text-[0.82rem] font-medium ${ACTION_TONE[recommendation.action] ?? 'text-mist-100'}`}
          >
            {recommendation.headline}
          </p>
          <p className="text-mist-400 mt-2 line-clamp-3 text-[0.76rem] leading-relaxed">
            {recommendation.detail}
          </p>

          <span className="text-gold-300 link-gold mt-auto pt-5 text-[0.66rem] tracking-[0.18em] uppercase">
            Open piece →
          </span>
        </Link>
      </Tilt>
    </Reveal>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const { listingsBySeller, ordersBySeller } = useStore();

  // Hooks must run before any early return, so the queries tolerate a null user
  // and the access guard happens after the memo below.
  const inventory = listingsBySeller(user?.id ?? '');
  const orders = ordersBySeller(user?.id ?? '');

  const stats = useMemo(() => {
    const active = inventory.filter((l) => l.status === 'live');
    const sold = inventory.filter((l) => l.status === 'sold');
    const scored = active.map((l) => ({ listing: l, health: inventoryHealth(l) }));
    const atRisk = scored.filter((s) => s.health.band === 'at_risk' || s.health.band === 'critical');

    return {
      active,
      sold,
      atRisk,
      liveValue: active.reduce((sum, l) => sum + l.askingPrice, 0),
      recovered: orders.reduce((sum, o) => sum + o.amount, 0),
      avgRecovery:
        active.length > 0
          ? active.reduce((sum, l) => sum + recoveryRate(l.askingPrice, l.retailPrice), 0) /
            active.length
          : 0,
      queue: [...scored].sort((a, b) => a.health.score - b.health.score).slice(0, 3),
    };
  }, [inventory, orders]);

  const inRenewal = inventory.filter(
    (l) => l.status === 'renewal_pool' || l.status === 'in_renewal',
  );

  if (!user || user.role !== 'seller') {
    return (
      <AppShell>
        <EmptyState
          title="Seller access required"
          body="Inventory management is tied to a seller account."
          action={
            <ButtonLink to="/enter" variant="gold">
              Choose a role
            </ButtonLink>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Reveal>
        <SectionHeading
          eyebrow={`${user.org} · seller`}
          title={<RevealWords text="Your inventory, scored" />}
          lede="Every live piece carries a health score, a fair-value band, and one recommended next move. Start with whatever is furthest from clearing."
          action={
            <ButtonLink to="/seller/new" variant="gold" size="lg">
              List a piece
            </ButtonLink>
          }
        />
      </Reveal>

      {/* -------------------------------- stats -------------------------------- */}
      <Reveal delay={100} className="mt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Live pieces"
            value={<Counter to={stats.active.length} />}
            sub={`${inventory.length} total in inventory`}
          />
          <StatCard
            label="Value on the exchange"
            value={<Counter to={stats.liveValue} format={(v) => moneyCompact(v)} />}
            sub="Sum of current asks"
            accent="gold"
          />
          <StatCard
            label="Recovered"
            value={<Counter to={stats.recovered} format={(v) => moneyCompact(v)} />}
            sub={`${stats.sold.length} pieces sold`}
            accent="verify"
          />
          <StatCard
            label="Needs attention"
            value={<Counter to={stats.atRisk.length} />}
            sub={
              stats.atRisk.length
                ? 'At risk or critical health'
                : 'Everything is clearing normally'
            }
            accent={stats.atRisk.length ? 'urgent' : 'verify'}
          />
        </div>
      </Reveal>

      {/* ----------------------------- action queue ---------------------------- */}
      {stats.queue.length > 0 && (
        <section className="mt-20">
          <Reveal>
            <div className="flex items-center gap-3">
              <span className="relative flex size-2">
                <span className="bg-gold-300 halo-ring absolute inset-0 rounded-full" />
                <span className="bg-gold-300 relative size-2 rounded-full" />
              </span>
              <p className="text-gold-400/85 text-[0.6rem] tracking-[0.28em] uppercase">
                AI recovery queue
              </p>
            </div>
            <h2 className="text-mist-100 mt-3 text-3xl">Three moves worth making today</h2>
          </Reveal>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {stats.queue.map((entry, i) => (
              <ActionCard key={entry.listing.id} listing={entry.listing} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------- inventory ----------------------------- */}
      <section className="mt-20">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-mist-100 text-3xl">All inventory</h2>
              <p className="text-mist-400 mt-2 text-sm">
                Average ask is {pct(stats.avgRecovery)} of original retail across live pieces.
              </p>
            </div>
            {inRenewal.length > 0 && (
              <p className="text-gold-300 text-[0.72rem]">
                {inRenewal.length} piece{inRenewal.length === 1 ? '' : 's'} in the renewal channel
              </p>
            )}
          </div>
        </Reveal>

        {inventory.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No inventory yet"
              body="Upload your first piece and Anvaya will score it, price it, and put it in front of matched buyers."
              action={<ButtonLink to="/seller/new" variant="gold">List a piece</ButtonLink>}
            />
          </div>
        ) : (
          <Reveal delay={80} className="mt-8">
            <Panel className="overflow-hidden">
              {/* Header row, desktop only */}
              <div className="border-gold-500/12 text-mist-500 hidden grid-cols-[2.6fr_1fr_1fr_1fr_0.8fr] gap-4 border-b px-6 py-4 text-[0.56rem] tracking-[0.2em] uppercase lg:grid">
                <span>Piece</span>
                <span>Ask</span>
                <span>Health</span>
                <span>Status</span>
                <span className="text-right">Days</span>
              </div>

              <ul className="divide-gold-500/10 divide-y">
                {inventory.map((listing) => {
                  const health = inventoryHealth(listing);
                  return (
                    <li key={listing.id}>
                      <Link
                        to={`/seller/piece/${listing.id}`}
                        className="hover:bg-royal-800/25 grid gap-4 px-6 py-4 transition-colors duration-300 lg:grid-cols-[2.6fr_1fr_1fr_1fr_0.8fr] lg:items-center"
                      >
                        <div className="flex items-center gap-4">
                          <div className="border-gold-500/15 size-11 shrink-0 overflow-hidden rounded-md border">
                            <PieceImage listing={listing} glow={false} sizes="3rem" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-mist-100 truncate text-[0.86rem]">{listing.title}</p>
                            <p className="text-mist-500 mt-0.5 text-[0.66rem]">
                              {listing.brand} · {listing.sku}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-gold-200 font-display text-lg">
                            {moneyCompact(listing.askingPrice)}
                          </p>
                          <p className="text-mist-500 text-[0.62rem]">
                            {pct(recoveryRate(listing.askingPrice, listing.retailPrice))} of retail
                          </p>
                        </div>

                        <div>
                          <HealthBar health={health} />
                        </div>

                        <div>
                          <StatusPill status={listing.status} />
                        </div>

                        <p className="text-mist-400 text-[0.75rem] lg:text-right">
                          {daysSince(listing.listedAt)}d
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </Reveal>
        )}
      </section>
    </AppShell>
  );
}
