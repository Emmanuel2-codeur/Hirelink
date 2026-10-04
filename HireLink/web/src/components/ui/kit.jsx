import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// En-tête de page : un seul h1 par écran, description courte, actions à droite.
export function PageHeader({ title, description, actions, className }) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

// État vide : une illustration, une phrase qui dit quoi faire, une action.
export function EmptyState({ illustration: Illu, title, description, action, className, compact }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white px-6 text-center', compact ? 'py-8' : 'py-12', className)}>
      {Illu && <Illu className={compact ? 'h-28 w-auto' : 'h-36 w-auto'} />}
      <p className="mt-2 text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const TONES = {
  success: ['bg-success-50 text-success border-success/20', CheckCircle2, 'status'],
  error: ['bg-danger-50 text-danger border-danger/20', AlertCircle, 'alert'],
  info: ['bg-teal-50 text-teal-600 border-teal/20', Info, 'status'],
};
// Retour d'action : icône + texte (jamais la couleur seule), annoncé aux lecteurs d'écran.
export function Alert({ tone = 'info', children, className }) {
  if (!children) return null;
  const [cls, Icon, role] = TONES[tone];
  return (
    <div role={role} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium', cls, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export const Skeleton = ({ className }) => <div className={cn('skeleton', className)} aria-hidden="true" />;
export const SkeletonCards = ({ n = 3, className = 'h-24' }) => (
  <div className="space-y-3" role="status" aria-label="Loading">{Array.from({ length: n }, (_, i) => <Skeleton key={i} className={className} />)}</div>
);

// Anneau de score (0-100) : texte + anneau, accessible.
export function ScoreRing({ value, size = 48 }) {
  const r = 18, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  const tone = v >= 80 ? 'stroke-teal' : v >= 60 ? 'stroke-warning' : 'stroke-muted';
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${v}%`}>
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="5" className="stroke-alabaster-200" />
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className={tone} strokeDasharray={`${(v / 100) * c} ${c}`} />
      </svg>
      <span className="text-xs font-bold tabular-nums text-ink">{v}</span>
    </span>
  );
}

export const Avatar = ({ name = '?', className }) => (
  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-600', className)} aria-hidden="true">
    {name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
  </span>
);
