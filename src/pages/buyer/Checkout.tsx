import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { quoteFor, useStore } from '../../context/StoreContext';
import { money } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { PieceImage } from '../../components/PieceImage';
import { ConditionChip, VerifiedSeal } from '../../components/Badges';
import { Button, ButtonLink, EmptyState, Panel } from '../../components/ui';
import { Monogram } from '../../components/Monogram';
import { Reveal } from '../../components/effects/Reveal';
import { GoldDust } from '../../components/effects/GoldDust';
import { Divider } from '../../components/effects/Atmosphere';

const ESCROW_STEPS = [
  {
    title: 'Funds held in escrow',
    body: 'Your payment sits with Anvaya, not the seller. Nothing is released yet.',
  },
  {
    title: 'Authentication',
    body: 'The relevant desk inspects the piece against the listing before it ships.',
  },
  {
    title: 'Insured delivery',
    body: 'White-glove courier, fully insured for the acquisition value, tracked end to end.',
  },
  {
    title: 'Release on acceptance',
    body: 'You have 48 hours from delivery to accept. The seller is paid on acceptance.',
  },
];

export default function Checkout() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listingById, purchase } = useStore();
  const [placed, setPlaced] = useState<Order | null>(null);
  const [working, setWorking] = useState(false);

  const listing = listingById(id);

  if (!listing || (listing.status !== 'live' && !placed)) {
    return (
      <AppShell>
        <EmptyState
          title="This piece cannot be acquired right now"
          body="It has either sold, been withdrawn by the seller, or moved into the renewal channel."
          action={<ButtonLink to="/browse" variant="gold">Back to the exchange</ButtonLink>}
        />
      </AppShell>
    );
  }

  if (!user || user.role !== 'buyer') {
    return (
      <AppShell>
        <EmptyState
          title="Buyer access required"
          body="Acquiring on the Premium Exchange needs a buyer account. Switch roles to continue."
          action={<ButtonLink to="/enter" variant="gold">Choose a role</ButtonLink>}
        />
      </AppShell>
    );
  }

  const quote = quoteFor(listing);

  const confirm = () => {
    setWorking(true);
    // A real build awaits a server-side payment intent here.
    window.setTimeout(() => {
      const order = purchase(listing.id, user.id);
      setWorking(false);
      if (order) setPlaced(order);
    }, 900);
  };

  /* ------------------------------ confirmation ----------------------------- */
  if (placed) {
    return (
      <AppShell>
        <Reveal direction="scale">
          <Panel className="relative mx-auto max-w-2xl overflow-hidden px-6 py-16 text-center sm:px-12">
            <GoldDust density={1.1} />
            <div className="relative">
              <Monogram size={72} />
              <p className="text-verify-light mt-8 flex items-center justify-center gap-2 text-[0.6rem] tracking-[0.28em] uppercase">
                <span className="bg-verify-light pulse-dot size-1.5 rounded-full" />
                Funds in escrow
              </p>
              <h1 className="text-mist-100 mt-4 text-4xl">Acquisition confirmed</h1>
              <p className="text-mist-300 mx-auto mt-4 max-w-md text-sm leading-relaxed">
                {placed.listingBrand} {placed.listingTitle} is reserved for you. The authentication
                desk has been notified and will inspect the piece before it ships.
              </p>

              <Divider className="mx-auto my-9 max-w-xs" />

              <dl className="mx-auto grid max-w-sm gap-3 text-left text-[0.8rem]">
                {[
                  { k: 'Reference', v: placed.reference },
                  { k: 'Tracking', v: placed.trackingCode },
                  { k: 'Total paid', v: money(placed.total) },
                ].map((row) => (
                  <div key={row.k} className="border-gold-500/12 flex justify-between border-b pb-2.5">
                    <dt className="text-mist-500 tracking-[0.14em] uppercase">{row.k}</dt>
                    <dd className="text-gold-200">{row.v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <ButtonLink to="/orders" variant="gold" size="lg">
                  Track this acquisition
                </ButtonLink>
                <ButtonLink to="/browse" variant="ghost" size="lg">
                  Keep browsing
                </ButtonLink>
              </div>
            </div>
          </Panel>
        </Reveal>
      </AppShell>
    );
  }

  /* --------------------------------- review -------------------------------- */
  return (
    <AppShell>
      <Reveal>
        <nav className="text-mist-500 flex items-center gap-2 text-[0.68rem] tracking-[0.14em] uppercase">
          <Link to="/browse" className="link-gold hover:text-gold-300">
            Exchange
          </Link>
          <span>/</span>
          <Link to={`/piece/${listing.id}`} className="link-gold hover:text-gold-300">
            {listing.sku}
          </Link>
          <span>/</span>
          <span className="text-gold-300">Acquire</span>
        </nav>

        <h1 className="text-mist-100 mt-6 text-4xl sm:text-5xl">Review your acquisition</h1>
        <p className="text-mist-400 mt-3 max-w-xl text-sm leading-relaxed">
          Payment is held by Anvaya until the piece is authenticated and accepted. Nothing reaches
          the seller before then.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Reveal direction="right">
          <Panel className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="relative aspect-square w-full shrink-0 sm:w-52">
                <PieceImage listing={listing} eager sizes="13rem" />
              </div>
              <div className="flex-1 p-6">
                <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">
                  {listing.brand}
                </p>
                <h2 className="text-mist-100 mt-2 text-2xl">{listing.title}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ConditionChip condition={listing.condition} />
                  {listing.verified && <VerifiedSeal by={listing.authenticator} compact />}
                </div>
                <p className="text-mist-400 mt-4 text-[0.8rem] leading-relaxed">
                  {listing.description}
                </p>
                <p className="text-mist-500 mt-4 text-[0.72rem]">
                  {listing.sku} · {listing.year} · {listing.location}
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="mt-6 p-6">
            <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">
              How settlement works
            </p>
            <ol className="mt-5 space-y-5">
              {ESCROW_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="border-gold-500/35 text-gold-300 flex size-7 shrink-0 items-center justify-center rounded-full border text-[0.68rem]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-mist-100 text-[0.86rem]">{step.title}</p>
                    <p className="text-mist-400 mt-1 text-[0.78rem] leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </Reveal>

        <Reveal direction="left" delay={120}>
          <Panel className="sticky top-32 p-6">
            <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">Summary</p>

            <dl className="mt-5 space-y-3 text-[0.84rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-mist-400">Piece</dt>
                <dd className="text-mist-100">{money(quote.amount)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist-400">
                  Escrow &amp; authentication
                  <span className="text-mist-500 block text-[0.68rem]">5% of acquisition</span>
                </dt>
                <dd className="text-mist-100">{money(quote.fee)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-mist-400">
                  Insured delivery
                  <span className="text-mist-500 block text-[0.68rem]">White-glove, tracked</span>
                </dt>
                <dd className="text-mist-100">{money(quote.shipping)}</dd>
              </div>
            </dl>

            <div className="border-gold-500/18 mt-5 flex items-end justify-between border-t pt-5">
              <span className="text-mist-500 text-[0.6rem] tracking-[0.2em] uppercase">
                Total today
              </span>
              <span className="text-gilded font-display text-3xl">{money(quote.total)}</span>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="mt-7 w-full"
              onClick={confirm}
              disabled={working}
            >
              {working ? 'Placing in escrow…' : 'Confirm acquisition'}
            </Button>

            <Button
              variant="quiet"
              size="sm"
              className="mt-3 w-full"
              onClick={() => navigate(`/piece/${listing.id}`)}
            >
              Back to the piece
            </Button>

            <p className="text-mist-500 mt-5 text-[0.68rem] leading-relaxed">
              Demo checkout. No payment method is collected and no money moves. A production build
              would create the payment intent server-side and never handle card data in the browser.
            </p>
          </Panel>
        </Reveal>
      </div>
    </AppShell>
  );
}
