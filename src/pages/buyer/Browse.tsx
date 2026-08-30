import { useMemo, useState } from 'react';
import { CATEGORIES, CONDITIONS, type Category, type Condition } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { matchScore } from '../../lib/ai';
import { money, moneyCompact } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { ItemCard } from '../../components/ItemCard';
import { Button, Chip, EmptyState, Input, Panel, SectionHeading, Select } from '../../components/ui';
import { Reveal, RevealWords } from '../../components/effects/Reveal';

type Sort = 'match' | 'recent' | 'price-desc' | 'price-asc' | 'watched';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'match', label: 'Best match' },
  { value: 'recent', label: 'Newest first' },
  { value: 'watched', label: 'Most watched' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'price-asc', label: 'Price: low to high' },
];

const CEILING = 9_500_000;

export default function Browse() {
  const { user } = useAuth();
  const { liveListings } = useStore();

  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [maxPrice, setMaxPrice] = useState(CEILING);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [renewedOnly, setRenewedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>(user?.role === 'buyer' ? 'match' : 'recent');

  const toggle = <T,>(list: T[], value: T, set: (next: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const activeFilters =
    categories.length + conditions.length + (verifiedOnly ? 1 : 0) + (renewedOnly ? 1 : 0) +
    (maxPrice < CEILING ? 1 : 0) + (query ? 1 : 0);

  const clearAll = () => {
    setQuery('');
    setCategories([]);
    setConditions([]);
    setMaxPrice(CEILING);
    setVerifiedOnly(false);
    setRenewedOnly(false);
  };

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = liveListings.filter((listing) => {
      if (categories.length && !categories.includes(listing.category)) return false;
      if (conditions.length && !conditions.includes(listing.condition)) return false;
      if (listing.askingPrice > maxPrice) return false;
      if (verifiedOnly && !listing.verified) return false;
      if (renewedOnly && !listing.renewedFrom) return false;
      if (!needle) return true;
      return [listing.title, listing.brand, listing.category, listing.materials, listing.location]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });

    const sorted = [...filtered];
    switch (sort) {
      case 'match':
        sorted.sort((a, b) => matchScore(b, user) - matchScore(a, user));
        break;
      case 'recent':
        sorted.sort((a, b) => +new Date(b.listedAt) - +new Date(a.listedAt));
        break;
      case 'watched':
        sorted.sort((a, b) => b.watchers - a.watchers);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.askingPrice - a.askingPrice);
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.askingPrice - b.askingPrice);
        break;
    }
    return sorted;
  }, [liveListings, query, categories, conditions, maxPrice, verifiedOnly, renewedOnly, sort, user]);

  const matched = useMemo(
    () =>
      user?.role === 'buyer'
        ? [...liveListings]
            .map((l) => ({ listing: l, score: matchScore(l, user) }))
            .filter((entry) => entry.score >= 68)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
        : [],
    [liveListings, user],
  );

  return (
    <AppShell>
      <Reveal>
        <SectionHeading
          eyebrow="Premium / Luxury Exchange"
          title={<RevealWords text="The exchange floor" />}
          lede="Authenticated premium inventory from vetted houses. Every piece carries the same price intelligence the seller sees."
          action={
            <div className="text-right">
              <p className="text-gilded font-display text-4xl">{results.length}</p>
              <p className="text-mist-500 text-[0.6rem] tracking-[0.2em] uppercase">
                pieces available
              </p>
            </div>
          }
        />
      </Reveal>

      {matched.length > 0 && (
        <Reveal delay={120} className="mt-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-royal-200 flex items-center gap-2 text-[0.6rem] tracking-[0.28em] uppercase">
                <span className="bg-royal-300 pulse-dot size-1.5 rounded-full" />
                Matched for {user?.name.split(' ')[0]}
              </p>
              <h2 className="text-mist-100 mt-2 text-2xl">
                Aligned with your saved brands and budget
              </h2>
            </div>
            <p className="text-mist-500 hidden max-w-xs text-right text-[0.68rem] leading-relaxed sm:block">
              Built from your interests: {user?.interests?.categories.join(', ')} · up to{' '}
              {moneyCompact(user?.interests?.budget ?? 0)}
            </p>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {matched.map((entry, i) => (
              <ItemCard key={entry.listing.id} listing={entry.listing} index={i} />
            ))}
          </div>
        </Reveal>
      )}

      {/* ------------------------------- filters ------------------------------- */}
      <Reveal delay={80} className="mt-16">
        <Panel className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <span className="text-mist-500 pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brand, reference, material, city…"
                aria-label="Search the exchange"
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-mist-500 text-[0.6rem] tracking-[0.18em] uppercase" htmlFor="sort">
                Sort
              </label>
              <Select
                id="sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className="w-48"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="border-gold-500/12 mt-6 space-y-5 border-t pt-6">
            <div>
              <p className="text-mist-500 mb-2.5 text-[0.58rem] tracking-[0.22em] uppercase">
                Category
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <Chip
                    key={category}
                    active={categories.includes(category)}
                    onClick={() => toggle(categories, category, setCategories)}
                  >
                    {category}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <p className="text-mist-500 mb-2.5 text-[0.58rem] tracking-[0.22em] uppercase">
                Condition
              </p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((condition) => (
                  <Chip
                    key={condition}
                    active={conditions.includes(condition)}
                    onClick={() => toggle(conditions, condition, setConditions)}
                  >
                    {condition}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-[2fr_1fr] sm:items-end">
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label
                    htmlFor="max-price"
                    className="text-mist-500 text-[0.58rem] tracking-[0.22em] uppercase"
                  >
                    Up to
                  </label>
                  <span className="text-gold-200 font-display text-lg">{money(maxPrice)}</span>
                </div>
                <input
                  id="max-price"
                  type="range"
                  min={20_000}
                  max={CEILING}
                  step={20_000}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="accent-gold-400 bg-ink-950 border-gold-500/15 h-1.5 w-full cursor-pointer appearance-none rounded-full border"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Chip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
                  Authenticated only
                </Chip>
                <Chip active={renewedOnly} onClick={() => setRenewedOnly((v) => !v)}>
                  Renewed
                </Chip>
              </div>
            </div>

            {activeFilters > 0 && (
              <div className="flex items-center justify-between gap-4">
                <p className="text-mist-500 text-[0.7rem]">
                  {activeFilters} filter{activeFilters === 1 ? '' : 's'} applied
                </p>
                <Button variant="quiet" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </Panel>
      </Reveal>

      {/* ------------------------------- results ------------------------------- */}
      <div className="mt-12">
        {results.length === 0 ? (
          <EmptyState
            title="Nothing matches that yet"
            body="The exchange is curated, so inventory moves in small batches. Widen the price ceiling or clear a filter to see more."
            action={
              <Button variant="ghost" onClick={clearAll}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((listing, i) => (
              <Reveal key={listing.id} delay={Math.min(i, 8) * 70}>
                <ItemCard listing={listing} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
