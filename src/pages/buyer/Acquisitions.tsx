import { Link } from 'react-router-dom';
import type { Order, OrderStage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { money, shortDate } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { PieceImage } from '../../components/PieceImage';
import { Button, ButtonLink, EmptyState, Panel, SectionHeading } from '../../components/ui';
import { StatCard } from '../../components/AiInsight';
import { Reveal, RevealWords } from '../../components/effects/Reveal';

const FLOW: { stage: OrderStage; label: string; note: string }[] = [
  { stage: 'escrow', label: 'In escrow', note: 'Funds held by Anvaya' },
  { stage: 'authenticating', label: 'Authenticating', note: 'Desk inspection in progress' },
  { stage: 'in_transit', label: 'In transit', note: 'Insured white-glove courier' },
  { stage: 'delivered', label: 'Delivered', note: 'Seller paid on acceptance' },
];

function Timeline({ order, onAdvance }: { order: Order; onAdvance: () => void }) {
  const current = FLOW.findIndex((step) => step.stage === order.stage);

  return (
    <div>
      <ol className="relative flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
        {FLOW.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const tone = done
            ? 'border-verify-light/60 bg-verify-deep text-verify-light'
            : active
              ? 'border-gold-300 bg-gold-500/20 text-gold-100'
              : 'border-mist-500/30 bg-ink-950/70 text-mist-500';

          return (
            <li key={step.stage} className="relative flex flex-1 gap-4 pb-6 sm:flex-col sm:pb-0">
              {/* Connector */}
              {i < FLOW.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute top-8 left-[0.72rem] h-full w-px sm:top-[0.72rem] sm:left-8 sm:h-px sm:w-full ${
                    done ? 'bg-verify-light/50' : 'bg-mist-500/20'
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.6rem] ${tone}`}
              >
                {done ? '✓' : active ? <span className="pulse-dot size-1.5 rounded-full bg-current" /> : i + 1}
              </span>

              <div className="sm:pr-6">
                <p
                  className={`text-[0.78rem] ${
                    done ? 'text-verify-light' : active ? 'text-gold-100' : 'text-mist-500'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-mist-500 mt-1 text-[0.68rem] leading-relaxed">{step.note}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {order.stage !== 'delivered' && (
        <Button variant="quiet" size="sm" className="mt-4" onClick={onAdvance}>
          Advance stage (demo)
        </Button>
      )}
    </div>
  );
}

export default function Acquisitions() {
  const { user } = useAuth();
  const { ordersByBuyer, advanceOrder, listingById } = useStore();

  if (!user || user.role !== 'buyer') {
    return (
      <AppShell>
        <EmptyState
          title="Buyer access required"
          body="Acquisitions are tied to a buyer account."
          action={<ButtonLink to="/enter" variant="gold">Choose a role</ButtonLink>}
        />
      </AppShell>
    );
  }

  const orders = ordersByBuyer(user.id);
  const totalSpend = orders.reduce((sum, order) => sum + order.total, 0);
  const inFlight = orders.filter((order) => order.stage !== 'delivered').length;

  return (
    <AppShell>
      <Reveal>
        <SectionHeading
          eyebrow="Your acquisitions"
          title={<RevealWords text="Everything you have taken off the exchange" />}
          lede="Each acquisition is held in escrow until the authentication desk signs it off and you accept delivery."
        />
      </Reveal>

      <Reveal delay={100} className="mt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Acquisitions" value={orders.length} />
          <StatCard label="Committed" value={money(totalSpend)} accent="gold" />
          <StatCard
            label="In flight"
            value={inFlight}
            sub={inFlight ? 'Awaiting authentication or delivery' : 'All settled'}
            accent={inFlight ? 'royal' : 'verify'}
          />
        </div>
      </Reveal>

      <div className="mt-12 space-y-6">
        {orders.length === 0 ? (
          <EmptyState
            title="No acquisitions yet"
            body="Pieces you acquire on the Premium Exchange will appear here with their escrow and delivery status."
            action={<ButtonLink to="/browse" variant="gold">Browse the exchange</ButtonLink>}
          />
        ) : (
          orders.map((order, i) => {
            const listing = listingById(order.listingId);
            return (
              <Reveal key={order.id} delay={i * 90}>
                <Panel className="overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    {listing && (
                      <Link
                        to={`/piece/${listing.id}`}
                        className="relative aspect-video w-full shrink-0 overflow-hidden lg:aspect-square lg:w-48"
                      >
                        <div className="h-full w-full transition-transform duration-700 hover:scale-105">
                          <PieceImage listing={listing} sizes="(min-width: 1024px) 12rem, 92vw" />
                        </div>
                      </Link>
                    )}

                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-gold-400/85 text-[0.58rem] tracking-[0.26em] uppercase">
                            {order.listingBrand}
                          </p>
                          <h3 className="text-mist-100 mt-1.5 text-xl">{order.listingTitle}</h3>
                          <p className="text-mist-500 mt-1.5 text-[0.7rem]">
                            {order.reference} · placed {shortDate(order.placedAt)} · tracking{' '}
                            {order.trackingCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gilded font-display text-2xl">{money(order.total)}</p>
                          <p className="text-mist-500 mt-1 text-[0.65rem]">
                            {money(order.amount)} + {money(order.fee + order.shipping)} fees
                          </p>
                        </div>
                      </div>

                      <div className="border-gold-500/12 mt-6 border-t pt-6">
                        <Timeline order={order} onAdvance={() => advanceOrder(order.id)} />
                      </div>
                    </div>
                  </div>
                </Panel>
              </Reveal>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
