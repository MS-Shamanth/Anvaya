/**
 * Slow-drifting royal blue and gold light field. Pure CSS transforms on
 * blurred radial gradients — cheap enough to sit behind the whole app.
 */
export function Aurora({ dense = false }: { dense?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="aurora-blob aurora-blob--royal" />
      <div className="aurora-blob aurora-blob--gold" />
      <div className="aurora-blob aurora-blob--deep" />
      {dense && <div className="aurora-blob aurora-blob--ember" />}
      {/* Fine gold grid, fading out toward the bottom of the viewport. */}
      <div className="absolute inset-0 bg-[image:var(--anvaya-grid)] bg-[size:64px_64px] opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
    </div>
  );
}
