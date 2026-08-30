import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, CONDITIONS, type Category, type Condition } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStore, type NewListingInput } from '../../context/StoreContext';
import { priceGuidance } from '../../lib/ai';
import { money, pct } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { PieceImage } from '../../components/PieceImage';
import { PriceBand } from '../../components/AiInsight';
import { ConditionChip } from '../../components/Badges';
import {
  Button,
  ButtonLink,
  EmptyState,
  Field,
  Input,
  Panel,
  SectionHeading,
  Select,
  Textarea,
} from '../../components/ui';
import { Reveal, RevealWords } from '../../components/effects/Reveal';
import { Tilt } from '../../components/effects/Tilt';

const THIS_YEAR = new Date().getFullYear();

const BLANK = {
  title: '',
  brand: '',
  category: 'Watches' as Category,
  condition: 'Excellent' as Condition,
  description: '',
  askingPrice: '',
  retailPrice: '',
  year: String(THIS_YEAR - 2),
  materials: '',
  location: 'Mumbai',
  includes: '',
  imageUrl: '',
};

export default function NewListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createListing } = useStore();

  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof typeof BLANK>(key: K, value: (typeof BLANK)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const retail = Number(form.retailPrice) || 0;
  const asking = Number(form.askingPrice) || 0;
  const year = Number(form.year) || THIS_YEAR;

  // The guidance panel recomputes on every keystroke, which is the point: the
  // seller sees the fair-value band form up as they describe the piece.
  const guidance = useMemo(
    () =>
      retail > 0
        ? priceGuidance({
            brand: form.brand.trim() || 'Unlisted',
            category: form.category,
            condition: form.condition,
            retailPrice: retail,
            year,
            verified: false,
          })
        : null,
    [form.brand, form.category, form.condition, retail, year],
  );

  const previewId = `preview-${form.brand}${form.title}${form.category}`;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Give the piece a name.';
    if (!form.brand.trim()) next.brand = 'Which house made it?';
    if (!form.description.trim()) next.description = 'Buyers need an honest condition note.';
    if (retail <= 0) next.retailPrice = 'Original retail drives the pricing model.';
    if (asking <= 0) next.askingPrice = 'Set an asking price.';
    if (year < 1900 || year > THIS_YEAR) next.year = `Between 1900 and ${THIS_YEAR}.`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (publish: boolean) => {
    if (!user || !validate()) return;

    const input: NewListingInput = {
      title: form.title.trim(),
      brand: form.brand.trim(),
      category: form.category,
      condition: form.condition,
      description: form.description.trim(),
      askingPrice: asking,
      retailPrice: retail,
      year,
      materials: form.materials.trim() || 'Not specified',
      location: form.location.trim() || 'Mumbai',
      includes: form.includes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      imageUrl: form.imageUrl.trim() || undefined,
    };

    const created = createListing(input, user.id, publish);
    navigate(`/seller/piece/${created.id}`);
  };

  if (!user || user.role !== 'seller') {
    return (
      <AppShell>
        <EmptyState
          title="Seller access required"
          body="Listing a piece needs a seller account."
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
          eyebrow="Inventory upload"
          title={<RevealWords text="List a piece" />}
          lede="Describe the piece honestly. Anvaya prices it against comparable inventory as you type, and buyers see the same band you do."
        />
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        {/* --------------------------------- form -------------------------------- */}
        <Reveal direction="right">
          <div className="space-y-6">
            <Panel className="p-6">
              <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">
                The piece
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="House / brand" error={errors.brand}>
                  {(id) => (
                    <Input
                      id={id}
                      value={form.brand}
                      onChange={(event) => set('brand', event.target.value)}
                      placeholder="Cartier"
                    />
                  )}
                </Field>

                <Field label="Title" error={errors.title}>
                  {(id) => (
                    <Input
                      id={id}
                      value={form.title}
                      onChange={(event) => set('title', event.target.value)}
                      placeholder="Tank Louis 18K Yellow Gold"
                    />
                  )}
                </Field>

                <Field label="Category">
                  {(id) => (
                    <Select
                      id={id}
                      value={form.category}
                      onChange={(event) => set('category', event.target.value as Category)}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <Field label="Condition">
                  {(id) => (
                    <Select
                      id={id}
                      value={form.condition}
                      onChange={(event) => set('condition', event.target.value as Condition)}
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
                label="Condition note"
                className="mt-5"
                error={errors.description}
                hint="Understating wear costs you at authentication. Say what is honest."
              >
                {(id) => (
                  <Textarea
                    id={id}
                    rows={4}
                    value={form.description}
                    onChange={(event) => set('description', event.target.value)}
                    placeholder="Case unpolished with crisp edges. Light hairlines on the clasp. Movement serviced last year."
                  />
                )}
              </Field>
            </Panel>

            <Panel className="p-6">
              <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">Pricing</p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field
                  label="Original retail (₹)"
                  error={errors.retailPrice}
                  hint="Drives the fair-value model."
                >
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      step={1000}
                      value={form.retailPrice}
                      onChange={(event) => set('retailPrice', event.target.value)}
                      placeholder="2250000"
                    />
                  )}
                </Field>

                <Field label="Your asking price (₹)" error={errors.askingPrice}>
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      step={1000}
                      value={form.askingPrice}
                      onChange={(event) => set('askingPrice', event.target.value)}
                      placeholder="1480000"
                    />
                  )}
                </Field>
              </div>

              {guidance && (
                <div className="border-gold-500/12 mt-6 border-t pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-gold-300 flex items-center gap-2 text-[0.58rem] tracking-[0.24em] uppercase">
                      <span className="bg-gold-300 pulse-dot size-1.5 rounded-full" />
                      Live price guidance
                    </p>
                    <Button
                      variant="quiet"
                      size="sm"
                      onClick={() => set('askingPrice', String(guidance.fair))}
                    >
                      Use fair value · {money(guidance.fair)}
                    </Button>
                  </div>

                  <div className="mt-5">
                    <PriceBand guidance={guidance} askingPrice={asking || guidance.fair} />
                  </div>

                  <ul className="mt-5 space-y-1.5">
                    {guidance.rationale.map((line) => (
                      <li
                        key={line}
                        className="text-mist-400 flex gap-2 text-[0.75rem] leading-relaxed"
                      >
                        <span className="text-gold-500/60 mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            <Panel className="p-6">
              <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">
                Provenance
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="Year" error={errors.year}>
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      min={1900}
                      max={THIS_YEAR}
                      value={form.year}
                      onChange={(event) => set('year', event.target.value)}
                    />
                  )}
                </Field>

                <Field label="Located in">
                  {(id) => (
                    <Input
                      id={id}
                      value={form.location}
                      onChange={(event) => set('location', event.target.value)}
                      placeholder="Mumbai"
                    />
                  )}
                </Field>

                <Field label="Materials" className="sm:col-span-2">
                  {(id) => (
                    <Input
                      id={id}
                      value={form.materials}
                      onChange={(event) => set('materials', event.target.value)}
                      placeholder="18K yellow gold, alligator leather"
                    />
                  )}
                </Field>

                <Field
                  label="What is included"
                  className="sm:col-span-2"
                  hint="Comma separated. Box and papers materially move the price."
                >
                  {(id) => (
                    <Input
                      id={id}
                      value={form.includes}
                      onChange={(event) => set('includes', event.target.value)}
                      placeholder="Original box, Certificate, Spare strap"
                    />
                  )}
                </Field>

                <Field
                  label="Photograph URL"
                  className="sm:col-span-2"
                  hint="Optional. Leave blank and the piece uses its Anvaya plate until you upload photography."
                >
                  {(id) => (
                    <Input
                      id={id}
                      type="url"
                      value={form.imageUrl}
                      onChange={(event) => set('imageUrl', event.target.value)}
                      placeholder="https://…/your-photograph.jpg"
                    />
                  )}
                </Field>
              </div>
            </Panel>

            <div className="flex flex-wrap gap-3">
              <Button variant="gold" size="lg" onClick={() => submit(true)}>
                Publish to the exchange
              </Button>
              <Button variant="ghost" size="lg" onClick={() => submit(false)}>
                Save as draft
              </Button>
            </div>
          </div>
        </Reveal>

        {/* -------------------------------- preview ------------------------------ */}
        <Reveal direction="left" delay={120}>
          <div className="lg:sticky lg:top-32">
            <p className="text-mist-500 mb-3 text-[0.58rem] tracking-[0.24em] uppercase">
              Buyer preview
            </p>

            <Tilt className="plate overflow-hidden" strength={5}>
              <div className="relative aspect-[4/3]">
                <PieceImage
                  listing={{
                    id: previewId,
                    brand: form.brand || 'Anvaya',
                    title: form.title || 'Untitled piece',
                    category: form.category,
                    imageUrl: form.imageUrl.trim() || undefined,
                  }}
                />
                <div className="from-ink-950/90 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
                <div className="absolute right-3 bottom-3">
                  <ConditionChip condition={form.condition} />
                </div>
              </div>

              <div className="p-5">
                <p className="text-gold-400/85 text-[0.6rem] tracking-[0.26em] uppercase">
                  {form.brand || 'House'}
                </p>
                <h3 className="text-mist-100 mt-1.5 text-lg">
                  {form.title || 'Untitled piece'}
                </h3>
                <p className="text-mist-400 mt-3 line-clamp-3 text-[0.78rem] leading-relaxed">
                  {form.description || 'Your condition note will appear here.'}
                </p>

                <div className="hairline mt-4 flex items-end justify-between border-t pt-4">
                  <div>
                    <p className="text-gilded font-display text-2xl">
                      {asking > 0 ? money(asking) : '—'}
                    </p>
                    {retail > 0 && asking > 0 && (
                      <p className="text-mist-500 mt-1 text-[0.65rem]">
                        {asking < retail
                          ? `${pct(1 - asking / retail)} under retail`
                          : `${pct(asking / retail)} of retail`}{' '}
                        · {form.location || 'Mumbai'}
                      </p>
                    )}
                  </div>
                  <span className="text-mist-500 text-[0.62rem] tracking-[0.14em] uppercase">
                    New
                  </span>
                </div>
              </div>
            </Tilt>

            <Panel className="mt-6 p-5">
              <p className="text-mist-500 text-[0.58rem] tracking-[0.22em] uppercase">
                What happens next
              </p>
              <ul className="mt-4 space-y-2.5">
                {[
                  'Anvaya scores the piece and assigns a fair-value band.',
                  'Buyers with matching saved interests are alerted.',
                  'Submit it for authentication to unlock the top of the band.',
                  'If it stalls, route it to the renewal pool instead of discounting.',
                ].map((line) => (
                  <li
                    key={line}
                    className="text-mist-300 flex gap-2.5 text-[0.76rem] leading-relaxed"
                  >
                    <span className="text-gold-500 mt-0.5 shrink-0">◇</span>
                    {line}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </Reveal>
      </div>
    </AppShell>
  );
}
