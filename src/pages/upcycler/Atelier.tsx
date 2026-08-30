import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONDITIONS, type Condition, type RenewalProject, type RenewalStage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { money, moneyCompact, relativeDays, shortDate } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { PieceImage } from '../../components/PieceImage';
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
  Select,
  Textarea,
  Toast,
} from '../../components/ui';
import { Reveal, RevealWords } from '../../components/effects/Reveal';
import { Counter } from '../../components/effects/Counter';

const STAGES: { stage: RenewalStage; label: string; note: string }[] = [
  { stage: 'intake', label: 'Intake', note: 'Condition confirmed against the brief' },
  { stage: 'restoration', label: 'Restoration', note: 'On the bench' },
  { stage: 'quality_check', label: 'Quality check', note: 'Re-authentication and sign-off' },
  { stage: 'relisted', label: 'Relisted', note: 'Back on the exchange' },
];

const NEXT_LABEL: Record<RenewalStage, string> = {
  intake: 'Start restoration',
  restoration: 'Send to quality check',
  quality_check: 'Quality check complete',
  relisted: 'Relisted',
};

function StageTrack({ stage }: { stage: RenewalStage }) {
  const current = STAGES.findIndex((s) => s.stage === stage);

  return (
    <ol className="flex flex-col gap-4 sm:flex-row sm:gap-0">
      {STAGES.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.stage} className="relative flex flex-1 gap-3 sm:flex-col">
            {i < STAGES.length - 1 && (
              <span
                aria-hidden
                className={`absolute top-7 left-[0.6rem] h-full w-px sm:top-[0.6rem] sm:left-6 sm:h-px sm:w-full ${
                  done ? 'bg-gold-400/50' : 'bg-mist-500/20'
                }`}
              />
            )}
            <span
              className={`relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.55rem] ${
                done
                  ? 'border-gold-400/70 bg-gold-600/40 text-gold-100'
                  : active
                    ? 'border-gold-300 bg-gold-500/25 text-gold-100'
                    : 'border-mist-500/30 bg-ink-950/70 text-mist-500'
              }`}
            >
              {done ? '✓' : active ? <span className="pulse-dot size-1.5 rounded-full bg-current" /> : i + 1}
            </span>
            <div className="sm:pr-5">
              <p
                className={`text-[0.74rem] ${
                  done || active ? 'text-gold-100' : 'text-mist-500'
                }`}
              >
                {step.label}
              </p>
              <p className="text-mist-500 mt-0.5 text-[0.64rem] leading-relaxed">{step.note}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function Atelier() {
  const { user } = useAuth();
  const { projectsByUpcycler, advanceProject, relistRenewed, listingById } = useStore();

  const [advancing, setAdvancing] = useState<RenewalProject | null>(null);
  const [note, setNote] = useState('');
  const [relisting, setRelisting] = useState<RenewalProject | null>(null);
  const [relistPrice, setRelistPrice] = useState(0);
  const [relistGrade, setRelistGrade] = useState<Condition>('Excellent');
  const [summary, setSummary] = useState('');
  const [toast, setToast] = useState('');

  const projects = projectsByUpcycler(user?.id ?? '');

  if (!user || user.role !== 'upcycler') {
    return (
      <AppShell>
        <EmptyState
          title="Upcycler access required"
          body="Atelier projects belong to an upcycler account."
          action={
            <ButtonLink to="/enter" variant="gold">
              Choose a role
            </ButtonLink>
          }
        />
      </AppShell>
    );
  }

  const active = projects.filter((p) => p.stage !== 'relisted');
  const deployed = active.reduce((sum, p) => sum + p.acquisitionCost + p.restorationBudget, 0);
  const projected = active.reduce((sum, p) => sum + p.targetPrice, 0);
  const completed = projects.filter((p) => p.stage === 'relisted');
  const realised = completed.reduce(
    (sum, p) => sum + (p.targetPrice - p.acquisitionCost - p.restorationBudget),
    0,
  );

  const confirmAdvance = () => {
    if (!advancing) return;
    advanceProject(advancing.id, note.trim() || 'Stage advanced.');
    setAdvancing(null);
    setNote('');
    setToast('Project stage updated');
  };

  const openRelist = (project: RenewalProject) => {
    setRelisting(project);
    setRelistPrice(project.targetPrice);
    setRelistGrade('Excellent');
    setSummary('');
  };

  const confirmRelist = () => {
    if (!relisting) return;
    const created = relistRenewed(relisting.id, {
      askingPrice: relistPrice,
      condition: relistGrade,
      summary:
        summary.trim() ||
        'Renewed in-atelier, re-authenticated, and returned to the exchange with the original provenance intact.',
    });
    setRelisting(null);
    setToast(created ? `Relisted at ${money(relistPrice)}` : 'Could not relist that piece');
  };

  return (
    <AppShell>
      <Reveal>
        <SectionHeading
          eyebrow={`${user.org} · atelier`}
          title={<RevealWords text="Work in progress" />}
          lede="Every piece you have claimed, from intake through to the moment it goes back on the exchange under your name."
          action={
            <ButtonLink to="/upcycler" variant="gold" size="lg">
              Browse the pool
            </ButtonLink>
          }
        />
      </Reveal>

      <Reveal delay={100} className="mt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="On the bench" value={<Counter to={active.length} />} sub={`${completed.length} completed`} />
          <StatCard
            label="Capital deployed"
            value={<Counter to={deployed} format={(v) => moneyCompact(v)} />}
            sub="Reserves plus restoration budgets"
            accent="gold"
          />
          <StatCard
            label="Projected relist"
            value={<Counter to={projected} format={(v) => moneyCompact(v)} />}
            sub="Target prices on active work"
            accent="royal"
          />
          <StatCard
            label="Realised margin"
            value={<Counter to={realised} format={(v) => moneyCompact(v)} />}
            sub="From relisted pieces"
            accent="verify"
          />
        </div>
      </Reveal>

      <div className="mt-14 space-y-6">
        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            body="Claim a piece from the renewal pool and it will appear here with its stage tracker and work log."
            action={
              <ButtonLink to="/upcycler" variant="gold">
                Open the renewal pool
              </ButtonLink>
            }
          />
        ) : (
          projects.map((project, i) => {
            const origin = listingById(project.listingId);
            const relisted = project.relistedListingId
              ? listingById(project.relistedListingId)
              : undefined;
            const allIn = project.acquisitionCost + project.restorationBudget;
            const margin = project.targetPrice - allIn;

            return (
              <Reveal key={project.id} delay={i * 100}>
                <Panel className="overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    {origin && (
                      <div className="relative aspect-video w-full shrink-0 lg:aspect-auto lg:w-48">
                        <PieceImage listing={origin} sizes="(min-width: 1024px) 12rem, 92vw" />
                      </div>
                    )}

                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-gold-400/85 text-[0.56rem] tracking-[0.24em] uppercase">
                            {project.listingBrand} · {project.reference}
                          </p>
                          <h3 className="text-mist-100 mt-1.5 text-xl">{project.listingTitle}</h3>
                          <p className="text-mist-500 mt-1.5 text-[0.7rem]">
                            Claimed {relativeDays(project.claimedAt)} at{' '}
                            {money(project.acquisitionCost)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className={`font-display text-2xl ${
                              margin > 0 ? 'text-verify-light' : 'text-urgent-light'
                            }`}
                          >
                            {moneyCompact(margin)}
                          </p>
                          <p className="text-mist-500 mt-1 text-[0.64rem]">
                            margin on {moneyCompact(allIn)} all in
                          </p>
                        </div>
                      </div>

                      <div className="border-gold-500/12 mt-6 border-t pt-6">
                        <StageTrack stage={project.stage} />
                      </div>

                      <div className="border-gold-500/12 mt-6 grid gap-6 border-t pt-6 lg:grid-cols-[1.4fr_1fr]">
                        <div>
                          <p className="text-mist-500 text-[0.56rem] tracking-[0.22em] uppercase">
                            Work log
                          </p>
                          <ol className="mt-3 space-y-2.5">
                            {[...project.log].reverse().map((entry, index) => (
                              <li key={`${entry.at}-${index}`} className="flex gap-3">
                                <span className="text-gold-500/60 mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                                <div>
                                  <p className="text-mist-300 text-[0.78rem] leading-relaxed">
                                    {entry.note}
                                  </p>
                                  <p className="text-mist-500 mt-0.5 text-[0.64rem]">
                                    {shortDate(entry.at)}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="flex flex-col gap-3">
                          {project.stage === 'quality_check' ? (
                            <Button variant="gold" onClick={() => openRelist(project)}>
                              Relist as renewed
                            </Button>
                          ) : project.stage !== 'relisted' ? (
                            <Button variant="ghost" onClick={() => setAdvancing(project)}>
                              {NEXT_LABEL[project.stage]}
                            </Button>
                          ) : (
                            relisted && (
                              <Link
                                to={`/piece/${relisted.id}`}
                                className="btn-ghost rounded-full px-5 py-2.5 text-center text-[0.7rem] tracking-[0.18em] uppercase"
                              >
                                View on the exchange
                              </Link>
                            )
                          )}

                          <dl className="text-[0.72rem]">
                            {[
                              { k: 'Reserve paid', v: money(project.acquisitionCost) },
                              { k: 'Restoration budget', v: money(project.restorationBudget) },
                              { k: 'Target price', v: money(project.targetPrice) },
                            ].map((row) => (
                              <div
                                key={row.k}
                                className="border-gold-500/10 flex justify-between gap-3 border-b py-2"
                              >
                                <dt className="text-mist-500">{row.k}</dt>
                                <dd className="text-mist-200">{row.v}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </Reveal>
            );
          })
        )}
      </div>

      {/* ------------------------------- advance -------------------------------- */}
      <Modal
        open={Boolean(advancing)}
        onClose={() => setAdvancing(null)}
        title={advancing ? NEXT_LABEL[advancing.stage] : 'Advance stage'}
        footer={
          <>
            <Button variant="quiet" onClick={() => setAdvancing(null)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={confirmAdvance}>
              Log and advance
            </Button>
          </>
        }
      >
        <p className="text-mist-300 text-[0.84rem] leading-relaxed">
          Notes are kept with the piece and travel with it when you relist, which is what lets a
          buyer trust a renewed item.
        </p>
        <Field label="Bench note" className="mt-5">
          {(id) => (
            <Textarea
              id={id}
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Case stripped and re-plated to original thickness. Dial left untouched."
            />
          )}
        </Field>
      </Modal>

      {/* -------------------------------- relist -------------------------------- */}
      <Modal
        open={Boolean(relisting)}
        onClose={() => setRelisting(null)}
        title="Relist as renewed"
        width="max-w-xl"
        footer={
          <>
            <Button variant="quiet" onClick={() => setRelisting(null)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={confirmRelist}>
              Publish renewed piece
            </Button>
          </>
        }
      >
        <p className="text-mist-300 text-[0.84rem] leading-relaxed">
          The renewed piece goes live under {user.org} with a provenance link back to the original
          listing. The original record is archived so it cannot be bought twice.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Asking price (₹)">
            {(id) => (
              <Input
                id={id}
                type="number"
                min={0}
                step={1000}
                value={relistPrice}
                onChange={(event) => setRelistPrice(Number(event.target.value))}
              />
            )}
          </Field>

          <Field label="Condition after renewal">
            {(id) => (
              <Select
                id={id}
                value={relistGrade}
                onChange={(event) => setRelistGrade(event.target.value as Condition)}
              >
                {CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field
          label="Renewal summary"
          className="mt-5"
          hint="Shown to buyers as the provenance note."
        >
          {(id) => (
            <Textarea
              id={id}
              rows={4}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="22K vermeil re-plating, full movement service, new crown, period-correct strap. 14 hours of bench work."
            />
          )}
        </Field>
      </Modal>

      {toast && <Toast message={toast} />}
    </AppShell>
  );
}
