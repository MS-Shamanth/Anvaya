import { AppShell } from '../components/AppShell';
import { Monogram } from '../components/Monogram';
import { ButtonLink } from '../components/ui';
import { Reveal } from '../components/effects/Reveal';
import { Divider } from '../components/effects/Atmosphere';

export default function NotFound() {
  return (
    <AppShell>
      <Reveal direction="scale">
        <div className="plate mx-auto max-w-lg px-6 py-20 text-center sm:px-12">
          <Monogram size={64} />
          <p className="text-gold-400/80 mt-8 text-[0.6rem] tracking-[0.3em] uppercase">404</p>
          <h1 className="text-mist-100 mt-3 text-4xl">Nothing catalogued here</h1>
          <Divider className="mx-auto my-8 max-w-xs" />
          <p className="text-mist-300 text-sm leading-relaxed">
            The page you were after is not part of the exchange. It may have been archived after a
            renewal, or the link is simply wrong.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/browse" variant="gold">
              Back to the exchange
            </ButtonLink>
            <ButtonLink to="/" variant="ghost">
              Home
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </AppShell>
  );
}
