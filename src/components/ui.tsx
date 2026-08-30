import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

type Variant = 'gold' | 'ghost' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-[0.7rem] tracking-[0.16em]',
  md: 'px-5 py-2.5 text-[0.74rem] tracking-[0.18em]',
  lg: 'px-8 py-4 text-[0.78rem] tracking-[0.2em]',
};

const VARIANTS: Record<Variant, string> = {
  gold: 'btn-gold font-semibold',
  ghost: 'btn-ghost',
  quiet: 'text-mist-300 hover:text-gold-200 border border-transparent hover:border-gold-500/25 hover:bg-ink-800/60',
  danger:
    'border border-urgent/50 bg-urgent-deep/40 text-urgent-light hover:bg-urgent/25 hover:border-urgent-light/70',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full uppercase transition-all duration-300 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]';

export function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Form controls                                                              */
/* -------------------------------------------------------------------------- */

const FIELD =
  'w-full rounded-lg border border-gold-500/18 bg-ink-950/55 px-3.5 py-2.5 text-sm text-mist-100 placeholder:text-mist-500 transition-all duration-250 focus:border-gold-400/70 focus:bg-ink-900/80 focus:outline-none focus:shadow-[0_0_0_3px_rgba(201,162,75,0.12)]';

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-mist-400 mb-1.5 block text-[0.62rem] tracking-[0.2em] uppercase">
      {children}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {error ? (
        <p className="text-urgent-light mt-1.5 text-xs">{error}</p>
      ) : hint ? (
        <p className="text-mist-500 mt-1.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD} ${rest.type === 'number' ? 'no-spin' : ''} ${className}`} {...rest} />;
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD} resize-y leading-relaxed ${className}`} {...rest} />;
}

export function Select({
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${FIELD} appearance-none pr-9 ${className}`} {...rest}>
      {children}
    </select>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                   */
/* -------------------------------------------------------------------------- */

export function Panel({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
}) {
  return <Tag className={`plate ${className}`}>{children}</Tag>;
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = 'left',
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: string;
  align?: 'left' | 'center';
  action?: ReactNode;
}) {
  const centered = align === 'center';
  return (
    <div
      className={`flex flex-col gap-4 ${centered ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'}`}
    >
      <div className={centered ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className="text-gold-400/80 mb-3 text-[0.6rem] tracking-[0.34em] uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-mist-100 text-3xl leading-tight sm:text-[2.6rem]">{title}</h2>
        {lede && <p className="text-mist-300 mt-4 text-sm leading-relaxed sm:text-base">{lede}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="bg-ink-950/80 absolute inset-0 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`plate rise relative w-full ${width} p-6 sm:p-7`}
      >
        <div className="mb-5 flex items-start justify-between gap-6">
          <h3 className="text-gold-200 text-2xl">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-mist-400 hover:text-gold-200 hover:border-gold-500/40 rounded-full border border-transparent px-2 py-0.5 text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>
        {children}
        {footer && <div className="hairline mt-6 flex justify-end gap-3 border-t pt-5">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small bits                                                                 */
/* -------------------------------------------------------------------------- */

export function Chip({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-[0.68rem] tracking-[0.12em] uppercase transition-all duration-300 ${
        active
          ? 'border-gold-400/70 bg-gold-500/15 text-gold-100 shadow-[0_0_18px_-6px_rgba(233,195,122,0.6)]'
          : 'border-gold-500/15 text-mist-400 hover:border-gold-500/40 hover:text-gold-200'
      }`}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="plate flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="border-gold-500/30 text-gold-400/60 flex size-14 items-center justify-center rounded-full border text-2xl">
        ◇
      </span>
      <h3 className="text-mist-100 text-xl">{title}</h3>
      <p className="text-mist-400 max-w-md text-sm leading-relaxed">{body}</p>
      {action}
    </div>
  );
}

export function Toast({ message, tone = 'gold' }: { message: string; tone?: 'gold' | 'verify' }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[70] flex justify-center px-4">
      <div
        className={`rise plate flex items-center gap-3 px-5 py-3 text-sm ${
          tone === 'verify' ? 'text-verify-light' : 'text-gold-200'
        }`}
      >
        <span className="bg-current pulse-dot size-1.5 rounded-full" />
        {message}
      </div>
    </div>
  );
}
