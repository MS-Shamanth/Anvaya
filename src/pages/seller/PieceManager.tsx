import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { priceGuidance } from '../../lib/ai';
import { daysSince, money, relativeDays, shortDate } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { PieceImage } from '../../components/PieceImage';
import { ConditionChip, StatusPill, UnverifiedTag, VerifiedSeal } from '../../components/Badges';
import { AiInsightPanel } from '../../components/AiInsight';
import {
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Input,
  Modal,
  Panel,
  Textarea,
  Toast,
} from '../../components/ui';
import { Reveal } from '../../components/effects/Reveal';
import { Tilt } from '../../components/effects/Tilt';

export default function PieceManager() {
  const { id = '' } = useParams();
  const { user, userById } = useAuth();
  const { listingById, updateListing, publishListing, routeToRenewal, withdrawFromRenewal, projects } =
    useStore();

  const listing = listingById(id);

  const [price, setPrice] = useState(listing?.askingPrice ?? 0);
  const [renewalOpen, setRenewalOpen] = useState(false);
  const [brief, setBrief] = useState('');
  const [reserve, setReserve] = useState(0);
  const [toast, setToast] = useState('');

  // Sync the local editors when a different piece is opened. Deliberately keyed
  // on the id alone so a store update never clobbers what the seller is typing.
  const openedId = listing?.id;
  useEffect(() => {
    if (!openedId) return;
    const current = listingById(openedId);
    if (!current) return;
    setPrice(current.askingPrice);
    setReserve(Math.round(current.askingPrice * 0.78));
    setBrief(current.renewal?.brief ?? '');
     
  }, [openedId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!listing) {
    return (
      <AppShell>
        <EmptyState
          title="Piece not found"
          body="It may have been archived after a renewal relisting."
          action={
            <ButtonLink to="/seller" variant="gold">
              Back to inventory
            </ButtonLink>
          }
        />
      </AppShell>
    );
  }

  if (!user || listing.sellerId !== user.id) {
    return (
      <AppShell>
        <EmptyState
          title="Not your piece"
          body="Only the listing owner can manage a piece. Sign in as the seller who owns it."
          action={
            <ButtonLink to="/enter" variant="gold">
              Choose a role
            </ButtonLink>
          }
        />
      </AppShell>
    );
  }

  const guidance = priceGuidance(listing);
  const project = projects.find((p) => p.listingId === listing.id);
  const atelier = project ? userById(project.upcyclerId) : undefined;
  const priceChanged = price !== listing.askingPrice && price > 0;

  const savePrice = () => {
    updateListing(listing.id, { askingPrice: price });
    setToast(`Ask updated to ${money(price)}`);
  };

  const sendToRenewal = () => {
    routeToRenewal(listing.id, brief.trim() || 'Full condition review and renewal at atelier discretion.', reserve);
    setRenewalOpen(false);
    setToast('Sent to the renewal pool');
  };

  return (
    <AppShell>
      <Reveal>
        <nav className="text-mist-500 flex items-center gap-2 text-[0.68rem] tracking-[0.14em] uppercase">
          <Link to="/seller" className="link-gold hover:text-gold-300">
            Inventory
          </Link>
          <span>/</span>
          <span className="text-gold-300">{listing.sku}</span>
        </nav>
      </Reveal>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.15fr] xl:gap-14">
        {/* ------------------------------- overview ------------------------------ */}
        <Reveal direction="right">
          <div className="space-y-6 lg:sticky lg:top-32">
            <Tilt className="plate overflow-hidden" strength={5}>
              <div className="relative aspect-square">
                <PieceImage listing={listing} eager sizes="(min-width: 1024px) 44vw, 92vw" />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <StatusPill status={listing.status} />
                  {listing.verified ? <VerifiedSeal by={listing.authenticator} compact /> : <UnverifiedTag />}
                </div>
                <div className="absolute right-4 bottom-4">
                  <ConditionChip condition={listing.condition} />
                </div>
              </div>
            </Tilt>

            <Panel className="p-6">
              <p className="text-gold-400/85 text-[0.58rem] tracking-[0.26em] uppercase">
                {listing.brand}
              </p>
              <h1 className="text-mist-100 mt-2 text-2xl">{listing.title}</h1>
              <p className="text-mist-400 mt-3 text-[0.82rem] leading-relaxed">
                {listing.description}
              </p>

              <div className="border-gold-500/12 mt-6 grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-4">
                {[
                  { k: 'Views', v: listing.views.toLocaleString('en-IN') },
                  { k: 'Watching', v: String(listing.watchers) },
                  { k: 'Days live', v: `${daysSince(listing.listedAt)}` },
                  { k: 'Listed', v: shortDate(listing.listedAt) },
                ].map((cell) => (
                  <div key={cell.k}>
                    <p className="text-mist-500 text-[0.55rem] tracking-[0.18em] uppercase">
                      {cell.k}
                    </p>
                    <p className="text-gold-200 font-display mt-1 text-lg">{cell.v}</p>
                  </div>
                ))}
              </div>

              <ButtonLink to={`/piece/${listing.id}`} variant="quiet" size="sm" className="mt-6">
                View as a buyer sees it →
              </ButtonLink>
            </Panel>
          </div>
        </Reveal>

        {/* -------------------------------- controls ----------------------------- */}
        <div className="space-y-6">
          {/* Renewal channel state */}
          {listing.status === 'renewal_pool' && (
            <Reveal direction="left">
              <Panel className="border-gold-400/30 p-6">
                <p className="text-gold-300 flex items-center gap-2 text-[0.6rem] tracking-[0.26em] uppercase">
                  <span className="bg-gold-300 pulse-dot size-1.5 rounded-full" />
                  In the renewal pool
                </p>
                <p className="text-mist-200 mt-4 text-[0.85rem] leading-relaxed">
                  {listing.renewal?.brief}
                </p>
                <p className="text-mist-400 mt-3 text-[0.78rem]">
                  Reserve to atelier: <span className="text-gold-200">{money(listing.renewal?.reserve ?? 0)}</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-5"
                  onClick={() => {
                    withdrawFromRenewal(listing.id);
                    setToast('Pulled back onto the exchange');
                  }}
                >
                  Withdraw and relist
                </Button>
              </Panel>
            </Reveal>
          )}

          {listing.status === 'in_renewal' && project && (
            <Reveal direction="left">
              <Panel className="border-gold-300/30 p-6">
                <p className="text-gold-300 text-[0.6rem] tracking-[0.26em] uppercase">
                  With an atelier
                </p>
                <p className="text-mist-100 mt-3 text-lg">{atelier?.org}</p>
                <p className="text-mist-400 mt-2 text-[0.8rem] leading-relaxed">
                  Claimed {relativeDays(project.claimedAt)} at {money(project.acquisitionCost)}.
                  Currently at the {project.stage.replace('_', ' ')} stage.
                </p>
                <p className="text-mist-500 mt-3 text-[0.72rem]">
                  You have already recovered {money(project.acquisitionCost)} on this piece.
                </p>
              </Panel>
            </Reveal>
          )}

          {listing.status === 'archived' && (
            <Reveal direction="left">
              <Panel className="p-6">
                <p className="text-mist-400 text-[0.6rem] tracking-[0.26em] uppercase">Archived</p>
                <p className="text-mist-300 mt-3 text-[0.84rem] leading-relaxed">
                  This piece was renewed and relisted by an atelier, so the original record is kept
                  for provenance only.
                </p>
              </Panel>
            </Reveal>
          )}

          {/* Pricing */}
          {(listing.status === 'live' || listing.status === 'draft') && (
            <Reveal direction="left">
              <Panel className="p-6">
                <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">Pricing</p>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                  <Field label="Asking price (₹)" className="flex-1">
                    {(fieldId) => (
                      <Input
                        id={fieldId}
                        type="number"
                        min={0}
                        step={1000}
                        value={price}
                        onChange={(event) => setPrice(Number(event.target.value))}
                      />
                    )}
                  </Field>
                  <Button variant="gold" onClick={savePrice} disabled={!priceChanged}>
                    Update ask
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: 'Floor', value: guidance.floor },
                    { label: 'Fair', value: guidance.fair },
                    { label: 'Ceiling', value: guidance.ceiling },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setPrice(preset.value)}
                      className="border-gold-500/20 text-mist-300 hover:border-gold-400/60 hover:text-gold-200 rounded-full border px-3 py-1.5 text-[0.68rem] transition-colors"
                    >
                      {preset.label} · {money(preset.value)}
                    </button>
                  ))}
                </div>

                <div className="border-gold-500/12 mt-6 flex flex-wrap gap-3 border-t pt-5">
                  {listing.status === 'draft' && (
                    <Button
                      variant="gold"
                      onClick={() => {
                        publishListing(listing.id);
                        setToast('Published to the exchange');
                      }}
                    >
                      Publish to the exchange
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setRenewalOpen(true)}>
                    Route to renewal pool
                  </Button>
                  {!listing.verified && (
                    <Button
                      variant="quiet"
                      onClick={() => {
                        updateListing(listing.id, {
                          verified: true,
                          authenticator: 'Anvaya Authentication Desk',
                        });
                        setToast('Marked as authenticated');
                      }}
                    >
                      Submit for authentication
                    </Button>
                  )}
                </div>
              </Panel>
            </Reveal>
          )}

          {/* AI panel */}
          <Reveal direction="left" delay={110}>
            <AiInsightPanel
              listing={listing}
              variant="seller"
              onApplyPrice={(suggested) => {
                setPrice(suggested);
                updateListing(listing.id, { askingPrice: suggested });
                setToast(`Ask moved to ${money(suggested)}`);
              }}
              onRouteToRenewal={() => setRenewalOpen(true)}
            />
          </Reveal>
        </div>
      </div>

      {/* -------------------------------- modal --------------------------------- */}
      <Modal
        open={renewalOpen}
        onClose={() => setRenewalOpen(false)}
        title="Route to the renewal pool"
        footer={
          <>
            <Button variant="quiet" onClick={() => setRenewalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={sendToRenewal}>
              Send to pool
            </Button>
          </>
        }
      >
        <p className="text-mist-300 text-[0.84rem] leading-relaxed">
          Upcyclers see the brief and the reserve. Whoever claims it pays your reserve up front, so
          you recover capital immediately instead of waiting for the piece to clear.
        </p>

        <div className="mt-6 space-y-5">
          <Field
            label="Renewal brief"
            hint="What needs doing, and what must be preserved."
          >
            {(fieldId) => (
              <Textarea
                id={fieldId}
                rows={4}
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder="Replace the crystal, service the movement, leave the case unpolished."
              />
            )}
          </Field>

          <Field
            label="Reserve to atelier (₹)"
            hint={`Currently ${Math.round((reserve / Math.max(1, listing.askingPrice)) * 100)}% of your ask.`}
          >
            {(fieldId) => (
              <Input
                id={fieldId}
                type="number"
                min={0}
                step={1000}
                value={reserve}
                onChange={(event) => setReserve(Number(event.target.value))}
              />
            )}
          </Field>
        </div>
      </Modal>

      {toast && <Toast message={toast} />}
    </AppShell>
  );
}
