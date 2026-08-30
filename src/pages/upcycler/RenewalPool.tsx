import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Condition, Listing } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { priceGuidance } from '../../lib/ai';
import { daysSince, money, moneyCompact, relativeDays } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { PieceImage } from '../../components/PieceImage';
import { ConditionChip } from '../../components/Badges';
import { StatCard } from '../../components/AiInsight';
import {
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Input,
  Modal,
  Panel,
  SectionHeading,
} from '../../components/ui';
import { Reveal, RevealWords } from '../../components/effects/Reveal';
import { Tilt } from '../../components/effects/Tilt';
import { Counter } from '../../components/effects/Counter';

/** What a competent renewal is expected to lift the condition grade to. */
const RENEWED_GRADE: Record<Condition, Condition> = {
  Restorable: 'Excellent',
  Good: 'Pristine',
  Excellent: 'Pristine',
  Pristine: 'Pristine',
  Unworn: 'Unworn',
};

/** Post-renewal fair value: same model, upgraded condition, authenticated. */
function renewedValue(listing: Listing) {
  return priceGuidance({
    brand: listing.brand,
    category: listing.category,
    condition: RENEWED_GRADE[listing.condition],
    retailPrice: listing.retailPrice,
    year: listing.year,
    verified: true,
  }).fair;
}

export default function RenewalPool() {
  const navigate = useNavigate();
  const { user, userById } = useAuth();
  const { renewalPool, claimForRenewal } = useStore();

  const [target, setTarget] = useState<Listing | null>(null);
  const [budget, setBudget] = useState(0);
  const [askTarget, setAskTarget] = useState(0);

  const openClaim = (listing: Listing) => {
    const projected = renewedValue(listing);
    setTarget(listing);
    setBudget(Math.round(projected * 0.14));
    setAskTarget(projected);
  };

  const confirmClaim = () => {
    if (!target || !user) return;
    const project = claimForRenewal(target.id, user.id, budget, askTarget);
    setTarget(null);
    if (project) navigate('/upcycler/projects');
  };

  if (!user || user.role !== 'upcycler') {
    return (
      <AppShell>
        <EmptyState
          title="Upcycler access required"
          body="The renewal pool is open to verified ateliers."
          action={
            <ButtonLink to="/enter" variant="gold">
              Choose a role
            </ButtonLink>
          }
        />
      </AppShell>
    );
  }

  const totalReserve = renewalPool.reduce((sum, l) => sum + (l.renewal?.reserve ?? 0), 0);
  const totalUpside = renewalPool.reduce(
    (sum, l) => sum + (renewedValue(l) - (l.renewal?.reserve ?? 0)),
    0,
  );

  return (
    <AppShell>
      <Reveal>
        <SectionHeading
          eyebrow={`${user.org} · upcycler`}
          title={<RevealWords text="The renewal pool" />}
          lede="Pieces sellers have taken off the open market rather than discount into the ground. Claim one at reserve, restore it, and return it to the exchange with its provenance intact."
        />
      </Reveal>

      <Reveal delay={100} className="mt-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Pieces in the pool"
            value={<Counter to={renewalPool.length} />}
            sub="Available to claim now"
          />
          <StatCard
            label="Combined reserve"
            value={<Counter to={totalReserve} format={(v) => moneyCompact(v)} />}
            sub="Capital to take the whole pool"
            accent="gold"
          />
          <StatCard
            label="Modelled upside"
            value={<Counter to={totalUpside} format={(v) => moneyCompact(v)} />}
            sub="Post-renewal fair value less reserve"
            accent="verify"
          />
        </div>
      </Reveal>

      <div className="mt-14">
        {renewalPool.length === 0 ? (
          <EmptyState
            title="The pool is empty right now"
            body="Sellers route pieces here when the AI recovery recommendation says renewal beats repricing. Check back, or look at what is already on the exchange."
            action={
              <ButtonLink to="/browse" variant="gold">
                Browse the exchange
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {renewalPool.map((listing, i) => {
              const reserve = listing.renewal?.reserve ?? listing.askingPrice;
              const projected = renewedValue(listing);
              const upside = projected - reserve;
              const seller = userById(listing.sellerId);

              return (
                <Reveal key={listing.id} delay={i * 120}>
                  <Tilt className="plate h-full overflow-hidden" strength={4}>
                    <div className="flex h-full flex-col">
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative aspect-video w-full shrink-0 sm:aspect-square sm:w-44">
                          <PieceImage listing={listing} sizes="(min-width: 640px) 11rem, 92vw" />
                          <div className="absolute bottom-3 left-3">
                            <ConditionChip condition={listing.condition} />
                          </div>
                        </div>

                        <div className="flex-1 p-5">
                          <p className="text-gold-400/85 text-[0.58rem] tracking-[0.24em] uppercase">
                            {listing.brand}
                          </p>
                          <h3 className="text-mist-100 mt-1.5 text-xl leading-snug">
                            {listing.title}
                          </h3>
                          <p className="text-mist-500 mt-2 text-[0.68rem]">
                            {listing.year} · {listing.location} · listed{' '}
                            {relativeDays(listing.listedAt)} · {daysSince(listing.listedAt)} days on
                            market
                          </p>
                          <p className="text-mist-400 mt-3 text-[0.78rem] leading-relaxed">
                            {listing.description}
                          </p>
                        </div>
                      </div>

                      <div className="border-gold-500/12 border-t p-5">
                        <p className="text-gold-300 text-[0.56rem] tracking-[0.24em] uppercase">
                          Renewal brief
                        </p>
                        <p className="text-mist-200 mt-2.5 text-[0.82rem] leading-relaxed">
                          {listing.renewal?.brief}
                        </p>
                        {seller && (
                          <p className="text-mist-500 mt-3 text-[0.7rem]">
                            From {seller.org} · {seller.standing} standing
                          </p>
                        )}
                      </div>

                      <div className="border-gold-500/12 mt-auto grid grid-cols-3 gap-3 border-t p-5">
                        <div>
                          <p className="text-mist-500 text-[0.55rem] tracking-[0.18em] uppercase">
                            Reserve
                          </p>
                          <p className="text-mist-100 font-display mt-1 text-xl">
                            {moneyCompact(reserve)}
                          </p>
                        </div>
                        <div>
                          <p className="text-mist-500 text-[0.55rem] tracking-[0.18em] uppercase">
                            Renewed fair value
                          </p>
                          <p className="text-gold-200 font-display mt-1 text-xl">
                            {moneyCompact(projected)}
                          </p>
                        </div>
                        <div>
                          <p className="text-mist-500 text-[0.55rem] tracking-[0.18em] uppercase">
                            Gross upside
                          </p>
                          <p
                            className={`font-display mt-1 text-xl ${
                              upside > 0 ? 'text-verify-light' : 'text-urgent-light'
                            }`}
                          >
                            {moneyCompact(upside)}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5">
                        <Button
                          variant="gold"
                          className="w-full"
                          onClick={() => openClaim(listing)}
                        >
                          Claim at {money(reserve)}
                        </Button>
                      </div>
                    </div>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------- claim -------------------------------- */}
      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title="Claim for renewal"
        footer={
          <>
            <Button variant="quiet" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={confirmClaim}>
              Claim the piece
            </Button>
          </>
        }
      >
        {target && (
          <>
            <div className="flex gap-4">
              <div className="border-gold-500/15 size-20 shrink-0 overflow-hidden rounded-lg border">
                <PieceImage listing={target} glow={false} sizes="5rem" />
              </div>
              <div>
                <p className="text-gold-400/85 text-[0.56rem] tracking-[0.24em] uppercase">
                  {target.brand}
                </p>
                <p className="text-mist-100 mt-1 text-lg">{target.title}</p>
                <p className="text-mist-500 mt-1.5 text-[0.72rem]">
                  Reserve {money(target.renewal?.reserve ?? target.askingPrice)} · grade{' '}
                  {target.condition} → {RENEWED_GRADE[target.condition]} after renewal
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <Field
                label="Restoration budget (₹)"
                hint="Parts, bench hours, and re-authentication."
              >
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step={1000}
                    value={budget}
                    onChange={(event) => setBudget(Number(event.target.value))}
                  />
                )}
              </Field>

              <Field label="Target relist price (₹)" hint="Pre-filled with post-renewal fair value.">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step={1000}
                    value={askTarget}
                    onChange={(event) => setAskTarget(Number(event.target.value))}
                  />
                )}
              </Field>
            </div>

            <Panel className="mt-6 p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { k: 'All in', v: (target.renewal?.reserve ?? target.askingPrice) + budget },
                  { k: 'Target', v: askTarget },
                  {
                    k: 'Net margin',
                    v: askTarget - (target.renewal?.reserve ?? target.askingPrice) - budget,
                  },
                ].map((cell) => (
                  <div key={cell.k}>
                    <p className="text-mist-500 text-[0.55rem] tracking-[0.18em] uppercase">
                      {cell.k}
                    </p>
                    <p
                      className={`font-display mt-1 text-lg ${
                        cell.k === 'Net margin'
                          ? cell.v > 0
                            ? 'text-verify-light'
                            : 'text-urgent-light'
                          : 'text-gold-200'
                      }`}
                    >
                      {moneyCompact(cell.v)}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <p className="text-mist-500 mt-5 text-[0.7rem] leading-relaxed">
              Claiming pays the seller their reserve immediately and moves the piece off the open
              market into your atelier queue.
            </p>
          </>
        )}
      </Modal>
    </AppShell>
  );
}
