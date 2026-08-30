/** Endless horizontal ticker. The item list is duplicated for a seamless loop. */
export function Marquee({
  items,
  speed = 42,
  reverse = false,
  className = '',
}: {
  items: string[];
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`marquee-mask relative flex overflow-hidden ${className}`}
      aria-label={`Houses trading on Anvaya: ${items.join(', ')}`}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className="flex shrink-0 items-center gap-12 pr-12"
          style={{
            animation: `marquee-slide ${speed}s linear infinite`,
            animationDirection: reverse ? 'reverse' : 'normal',
          }}
        >
          {items.map((item) => (
            <span
              key={`${copy}-${item}`}
              className="font-display text-mist-300 hover:text-gold-300 shrink-0 text-xl tracking-[0.24em] whitespace-nowrap uppercase transition-colors duration-300"
            >
              {item}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
