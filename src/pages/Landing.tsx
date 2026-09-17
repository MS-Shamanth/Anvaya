import { Link } from 'react-router-dom';
import type { Role } from '../types';
import { useStore } from '../context/StoreContext';
import { inventoryHealth, priceGuidance } from '../lib/ai';
import { money, moneyCompact } from '../lib/format';
import { useTypewriter } from '../lib/motion';
import { BareShell } from '../components/AppShell';
import { Monogram } from '../components/Monogram';
import { ItemCard } from '../components/ItemCard';
import { HealthMeter } from '../components/Badges';
import { PriceBand } from '../components/AiInsight';
import { Button, ButtonLink } from '../components/ui';
import { GoldDust } from '../components/effects/GoldDust';
import { Reveal, RevealWords } from '../components/effects/Reveal';
import { Tilt } from '../components/effects/Tilt';
import { Counter } from '../components/effects/Counter';
import { Marquee } from '../components/effects/Marquee';
import { Divider } from '../components/effects/Atmosphere';

const HOUSES = [
  'Rolex',
  'Hermès',
  'Patek Philippe',
  'Cartier',
  'Chanel',
  'Van Cleef & Arpels',
  'Sabyasachi',
  'Bvlgari',
  'Louis Vuitton',
  'Audemars Piguet',
  'Baccarat',
  'Berluti',
];

const ROLE_CARDS: {
  role: Role;
  title: string;
  line: string;
  body: string;
  actions: string[];
  glyph: React.ReactNode;
}[] = [
  {
    role: 'buyer',
    title: 'Buyer',
    line: 'Acquire with certainty',
    body: 'Browse authenticated premium inventory, see the same price intelligence the seller sees, and settle through escrow.',
    actions: ['Smart filters across brand, condition, and band', 'AI-matched pieces from saved interests', 'Escrow-held payment until authentication clears'],
    glyph: (
      <svg viewBox="0 0 48 48" fill="none" className="size-full">
        <path d="M12 18h24l-2.5 22h-19L12 18z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M18 18v-3a6 6 0 0112 0v3" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="24" cy="28" r="3.2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    role: 'seller',
    title: 'Seller',
    line: 'Recover more, faster',
    body: 'Upload excess, returned, or aging stock. Every piece is scored, priced, and given one clear next move.',
    actions: ['Inventory health and risk scoring per piece', 'Fair-value band with confidence rating', 'One-tap reprice or route to an atelier'],
    glyph: (
      <svg viewBox="0 0 48 48" fill="none" className="size-full">
        <path d="M8 40V22l16-12 16 12v18" stroke="currentColor" strokeWidth="1.4" />
        <path d="M18 40V28h12v12" stroke="currentColor" strokeWidth="1.4" />
        <path d="M24 10v-4M24 6l6 2M24 6l-6 2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    role: 'upcycler',
    title: 'Upcycler',
    line: 'Give it a second life',
    body: 'Claim pieces from the renewal pool at reserve, restore them on the bench, and return them to the exchange with provenance intact.',
    actions: ['Renewal pool with condition briefs and reserves', 'Project tracking from intake to relist', 'Provenance linked back to the original listing'],
    glyph: (
      <svg viewBox="0 0 48 48" fill="none" className="size-full">
        <path d="M10 24a14 14 0 0123.8-10M38 24a14 14 0 01-23.8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M34 8v7h-7M14 40v-7h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3.4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
];

const LOOP = [
  {
    step: '01',
    title: 'List',
    body: 'A seller uploads a piece with condition, provenance, and what came in the box.',
  },
  {
    step: '02',
    title: 'Score',
    body: 'Anvaya returns a health score, a fair-value band, and the reasoning behind both.',
  },
  {
    step: '03',
    title: 'Match',
    body: 'The piece surfaces to buyers whose saved brands, categories, and budget line up.',
  },
  {
    step: '04',
    title: 'Settle',
    body: 'Payment is held in escrow until the authentication desk signs the piece off.',
  },
  {
    step: '05',
    title: 'Renew',
    body: 'Anything that stalls goes to an atelier at reserve instead of sitting dead.',
  },
  {
    step: '06',
    title: 'Return',
    body: 'The renewed piece relists with its full history, and the loop closes.',
  },
];

const PALETTE = [
  { name: 'Royal Ink', hex: '#070D1F', use: 'Base' },
  { name: 'Royal Blue', hex: '#1D4392', use: 'Brand' },
  { name: 'Anvaya Gold', hex: '#C9A24B', use: 'Accent' },
  { name: 'Gilt Highlight', hex: '#E9C37A', use: 'Highlight' },
  { name: 'Verify Emerald', hex: '#1D7A5B', use: 'Trust' },
  { name: 'Auction Rust', hex: '#B4472A', use: 'Urgency' },
];

function Hero() {
  const typed = useTypewriter([
    'excess inventory',
    'returned stock',
    'aging luxury',
    'unsold couture',
  ]);

  return (
    <section className="relative flex min-h-dvh items-center overflow-hidden pt-24 pb-16">
      <GoldDust density={1.25} />

      {/* Concentric gold rings behind the mark */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="border-gold-500/10 floaty size-[42rem] max-w-[92vw] rounded-full border" />
        <div className="border-gold-500/[0.07] absolute size-[58rem] max-w-[96vw] rounded-full border" />
        <div className="border-royal-400/[0.09] absolute size-[74rem] max-w-[99vw] rounded-full border" />
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal direction="scale" duration={1100}>
            <div className="flex justify-center">
              <Monogram size={112} className="glow-mark" />
            </div>
          </Reveal>

          <Reveal delay={220}>
            {/* shimmer sweeps a highlight across the logotype on a loop */}
            <h1 className="shimmer font-display mt-8 text-5xl leading-none tracking-[0.32em] sm:text-7xl breathe">
              ANVAYA
            </h1>
            <p className="text-mist-400 mt-4 text-[0.66rem] tracking-[0.44em] uppercase sm:text-[0.78rem] shimmer-text">
              Premium&nbsp;·&nbsp;Luxury&nbsp;Exchange
            </p>
          </Reveal>

          <Reveal delay={380} className="mt-10">
            <Divider className="mx-auto max-w-md" />
          </Reveal>

          <h2 className="text-mist-100 mt-10 text-3xl leading-[1.15] sm:text-[3.4rem]">
            <RevealWords text="Turn" delay={480} />{' '}
            <span className="text-gilded relative inline-block">
              {typed}
              <span className="bg-gold-300 ml-1 inline-block h-[0.9em] w-[2px] translate-y-[0.08em] animate-pulse" />
            </span>
            <br />
            <RevealWords text="back into revenue." delay={620} />
          </h2>

          <Reveal delay={860}>
            <p className="text-mist-300 mx-auto mt-7 max-w-2xl text-base leading-relaxed sm:text-lg">
              Sellers list high-value inventory. Buyers acquire it with the same numbers the seller
              sees. Upcyclers give whatever stalls a second life. AI scores and prices every piece
              along the way.
            </p>
          </Reveal>

          <Reveal delay={1000}>
            <div className="mt-10">
              <Link to="/enter">
                <Button variant="gold" size="lg" className="btn-magnetic">
                  Enter the exchange
                </Button>
              </Link>
              <p className="text-mist-500 mt-5 text-[0.68rem] shimmer-text">
                Sign in with your credentials to access the platform.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Floating figures */}
        <Reveal delay={1150} className="mt-16">
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4">
            {[
              { label: 'Pieces on the exchange', value: 21, suffix: '' },
              { label: 'Recovered this quarter', value: 4.9, prefix: '₹', suffix: ' Cr' },
              { label: 'Renewal rate', value: 68, suffix: '%' },
            ].map((stat, i) => (
              <div key={stat.label} className={`plate px-4 py-5 text-center lift card-animate stagger-${i + 1} glass`}>
                <p className="text-gilded font-display text-2xl sm:text-4xl">
                  {stat.prefix}
                  <Counter
                    to={stat.value}
                    format={(v) => (stat.value % 1 ? v.toFixed(1) : Math.round(v).toString())}
                  />
                  {stat.suffix}
                </p>
                <p className="text-mist-500 mt-2 text-[0.58rem] tracking-[0.18em] uppercase shimmer-text">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden
        className="text-mist-500 absolute inset-x-0 bottom-7 flex flex-col items-center gap-2"
      >
        <span className="text-[0.55rem] tracking-[0.28em] uppercase">Scroll</span>
        <span className="from-gold-400/70 h-10 w-px bg-gradient-to-b to-transparent" />
      </div>
    </section>
  );
}

function RoleSection() {
  return (
    <section id="roles" className="mx-auto max-w-[1400px] px-5 py-28 sm:px-8">
      <Reveal>
        <p className="text-gold-400/80 text-center text-[0.6rem] tracking-[0.34em] uppercase">
          Phase 1 · three logins
        </p>
        <h2 className="text-mist-100 mt-4 text-center text-4xl sm:text-[3rem]">
          <RevealWords text="One exchange, three vantage points" />
        </h2>
        <p className="text-mist-300 mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed sm:text-base">
          Every role sees the same piece and the same intelligence. What differs is what they can do
          with it.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {ROLE_CARDS.map((card, i) => (
          <Reveal key={card.role} delay={i * 130}>
            <Tilt className={`plate group h-full p-7 lift card-animate stagger-${i + 1}`} strength={5}>
              <div className="flex h-full flex-col">
                <div className="text-gold-400/85 group-hover:text-gold-200 size-12 transition-colors duration-500 breathe">
                  {card.glyph}
                </div>

                <p className="text-mist-500 mt-6 text-[0.58rem] tracking-[0.26em] uppercase shimmer-text">
                  {card.title}
                </p>
                <h3 className="text-gilded mt-2 text-2xl holographic">{card.line}</h3>
                <p className="text-mist-300 mt-4 text-[0.86rem] leading-relaxed">{card.body}</p>

                <ul className="mt-6 space-y-2.5">
                  {card.actions.map((action) => (
                    <li key={action} className="text-mist-400 flex gap-2.5 text-[0.78rem] leading-relaxed">
                      <span className="text-gold-500 mt-1 shrink-0 pulse-dot">◇</span>
                      {action}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/enter"
                  className="btn-ghost btn-magnetic mt-7 block w-full rounded-full py-3 text-center text-[0.7rem] tracking-[0.18em] uppercase"
                >
                  Sign in
                </Link>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LoopSection() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <p className="text-gold-400/80 text-[0.6rem] tracking-[0.34em] uppercase">
            How a piece moves
          </p>
          <h2 className="text-mist-100 mt-4 max-w-3xl text-4xl sm:text-[3rem]">
            <RevealWords text="Nothing sits still, and nothing gets written off." />
          </h2>
        </Reveal>

        <div className="relative mt-16">
          {/* Gold spine connecting the steps */}
          <div
            aria-hidden
            className="via-gold-500/40 absolute top-0 left-[1.15rem] hidden h-full w-px bg-gradient-to-b from-transparent to-transparent lg:left-1/2 lg:block"
          />

          <ol className="space-y-6 lg:space-y-0">
            {LOOP.map((item, i) => (
              <Reveal
                key={item.step}
                direction={i % 2 === 0 ? 'right' : 'left'}
                delay={i * 90}
                as="li"
              >
                <div
                  className={`lg:flex lg:items-center lg:gap-10 ${i % 2 === 0 ? '' : 'lg:flex-row-reverse'}`}
                >
                  <div className={`plate lift group relative flex-1 p-6 lg:p-7 card-animate glass stagger-${(i % 6) + 1}`}>
                    <div className="flex items-baseline gap-4">
                      <span className="text-gold-500/50 font-display group-hover:text-gold-300 text-4xl transition-colors duration-500">
                        {item.step}
                      </span>
                      <h3 className="text-gilded text-2xl shimmer-text">{item.title}</h3>
                    </div>
                    <p className="text-mist-300 mt-3 text-[0.86rem] leading-relaxed">{item.body}</p>
                  </div>

                  {/* Node on the spine */}
                  <span
                    aria-hidden
                    className="bg-gold-400 border-ink-950 relative z-10 hidden size-3 shrink-0 rounded-full border-2 shadow-[0_0_16px_rgba(233,195,122,0.9)] lg:block"
                  />
                  <div className="hidden flex-1 lg:block" />
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function IntelligenceSection() {
  const { listingById } = useStore();
  // A real listing from the exchange, scored live by the same code the app uses.
  const sample = listingById('l-014') ?? listingById('l-001');
  if (!sample) return null;

  const health = inventoryHealth(sample);
  const guidance = priceGuidance(sample);

  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="text-gold-400/80 text-[0.6rem] tracking-[0.34em] uppercase">
              AI intelligence layer
            </p>
            <h2 className="text-mist-100 mt-4 text-4xl sm:text-[3rem]">
              <RevealWords text="Every score shows its working." />
            </h2>
            <p className="text-mist-300 mt-6 text-sm leading-relaxed sm:text-base">
              Anvaya scores each piece on days-on-market, price against the fair-value band,
              authentication status, and the ratio of watchers to views. The output is a number, a
              band, and the drivers behind it, so a seller can argue with it.
            </p>
            <p className="text-mist-400 mt-4 text-sm leading-relaxed">
              The panel to the right is live. It is running the same model the seller dashboard
              runs, on a real listing that has been sitting on the exchange too long.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { k: 'Health', v: `${health.score}/100` },
                { k: 'Fair value', v: moneyCompact(guidance.fair) },
                { k: 'Confidence', v: guidance.confidence },
              ].map((cell) => (
                <div key={cell.k} className="border-gold-500/15 border-l pl-3">
                  <p className="text-mist-500 text-[0.55rem] tracking-[0.2em] uppercase">{cell.k}</p>
                  <p className="text-gold-200 font-display mt-1 text-xl">{cell.v}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal direction="left" delay={140}>
            <Tilt className="plate p-7 glass lift card-animate" strength={4}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-gold-400/85 text-[0.58rem] tracking-[0.24em] uppercase shimmer-text">
                    {sample.brand}
                  </p>
                  <h3 className="text-mist-100 mt-1.5 text-xl holographic">{sample.title}</h3>
                  <p className="text-mist-500 mt-1 text-[0.7rem]">
                    Asking {money(sample.askingPrice)} · retail {money(sample.retailPrice)}
                  </p>
                </div>
                <div className="glow-mark">
                  <HealthMeter health={health} size={76} showLabel={false} />
                </div>
              </div>

              <div className="border-gold-500/12 mt-6 border-t pt-6">
                <PriceBand guidance={guidance} askingPrice={sample.askingPrice} />
              </div>

              <ul className="mt-6 space-y-2">
                {health.drivers.slice(0, 4).map((driver) => (
                  <li key={driver} className="text-mist-300 flex gap-2 text-[0.78rem] leading-relaxed">
                    <span className="text-gold-500/70 mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                    {driver}
                  </li>
                ))}
              </ul>
            </Tilt>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  const { liveListings } = useStore();
  const featured = [...liveListings].sort((a, b) => b.watchers - a.watchers).slice(0, 4);

  return (
    <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-gold-400/80 text-[0.6rem] tracking-[0.34em] uppercase">
              On the exchange now
            </p>
            <h2 className="text-mist-100 mt-4 text-4xl sm:text-[3rem]">Most watched</h2>
          </div>
          <ButtonLink to="/browse" variant="ghost">
            View all pieces
          </ButtonLink>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((listing, i) => (
          <Reveal key={listing.id} delay={i * 110}>
            <ItemCard listing={listing} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PaletteSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8">
      <Reveal>
        <p className="text-gold-400/80 text-[0.6rem] tracking-[0.34em] uppercase">Design language</p>
        <h2 className="text-mist-100 mt-4 max-w-3xl text-4xl sm:text-[3rem]">
          <RevealWords text="Royal blue and gold, taken from the mark." />
        </h2>
        <p className="text-mist-300 mt-5 max-w-2xl text-sm leading-relaxed">
          Every value below is sampled from the Anvaya logo. Emerald is reserved for verification
          and rust for urgency, so buyers read trust and time pressure without needing a legend.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {PALETTE.map((swatch, i) => (
          <Reveal key={swatch.hex} delay={i * 70}>
            <div className="plate lift group overflow-hidden">
              <div
                className="relative h-24 w-full"
                style={{ backgroundColor: swatch.hex }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
              <div className="p-4">
                <p className="text-mist-100 text-[0.8rem]">{swatch.name}</p>
                <p className="text-mist-500 mt-1 font-mono text-[0.66rem]">{swatch.hex}</p>
                <p className="text-gold-400/70 mt-2 text-[0.55rem] tracking-[0.18em] uppercase">
                  {swatch.use}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="relative overflow-hidden py-28">
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal direction="scale">
          <div className="plate relative overflow-hidden px-6 py-20 text-center sm:px-16 glass">
            <GoldDust density={0.7} />
            <div className="relative">
              {/* breathe animates transform, glow-mark animates filter — they have
                  to sit on different elements or the shorthand overrides one. */}
              <span className="breathe inline-block">
                <Monogram size={72} animate={false} className="glow-mark" />
              </span>
              <h2 className="text-mist-100 mt-8 text-4xl leading-tight sm:text-[3.2rem]">
                <span className="text-gilded shimmer-text">Excess is not a loss.</span>
                <br />
                <span className="holographic">It is unpriced revenue.</span>
              </h2>
              <p className="text-mist-300 mx-auto mt-6 max-w-xl text-sm leading-relaxed sm:text-base">
                Phase 1 is live: the Premium Exchange, three roles, and the full AI layer. B2B, B2C,
                and auction channels follow.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <ButtonLink to="/enter" variant="gold" size="lg" className="btn-magnetic">
                  Choose a role
                </ButtonLink>
                <ButtonLink to="/browse" variant="ghost" size="lg" className="btn-magnetic">
                  Browse the exchange
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <BareShell>
      <Hero />

      <div className="border-gold-500/10 border-y py-7">
        <Marquee items={HOUSES} speed={48} />
      </div>

      <RoleSection />
      <LoopSection />
      <IntelligenceSection />
      <FeaturedSection />
      <PaletteSection />
      <ClosingSection />
    </BareShell>
  );
}
