import { useStore } from '../../context/StoreContext';
import { money } from '../../lib/format';
import { AppShell } from '../../components/AppShell';
import { ItemCard } from '../../components/ItemCard';
import { ButtonLink, EmptyState, SectionHeading } from '../../components/ui';
import { StatCard } from '../../components/AiInsight';
import { Reveal, RevealWords } from '../../components/effects/Reveal';

export default function Watchlist() {
  const { watchlist, listingById } = useStore();

  const pieces = watchlist
    .map((id) => listingById(id))
    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing));

  const available = pieces.filter((piece) => piece.status === 'live');
  const value = available.reduce((sum, piece) => sum + piece.askingPrice, 0);

  return (
    <AppShell>
      <Reveal>
        <SectionHeading
          eyebrow="Saved pieces"
          title={<RevealWords text="Your watchlist" />}
          lede="Pieces you are tracking. Anvaya factors watch signals into each listing's health score, so watching a piece nudges the seller."
        />
      </Reveal>

      {pieces.length > 0 && (
        <Reveal delay={100} className="mt-10">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Watching" value={pieces.length} />
            <StatCard label="Still available" value={available.length} accent="verify" />
            <StatCard label="Combined ask" value={money(value)} accent="gold" />
          </div>
        </Reveal>
      )}

      <div className="mt-12">
        {pieces.length === 0 ? (
          <EmptyState
            title="Nothing on your watchlist"
            body="Tap the heart on any piece to track it. You will see it here alongside its current ask."
            action={<ButtonLink to="/browse" variant="gold">Browse the exchange</ButtonLink>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pieces.map((piece, i) => (
              <Reveal key={piece.id} delay={i * 80}>
                <ItemCard listing={piece} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
