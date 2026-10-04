import { cn } from '@/lib/utils';

export const Card = ({ className, ...p }) => <div className={cn('rounded-xl border border-line bg-white p-4 shadow-card md:p-5', className)} {...p} />;
export const CardTitle = ({ className, as: Tag = 'h2', ...p }) => <Tag className={cn('text-base font-semibold text-ink md:text-lg', className)} {...p} />;

const TONES = { teal: 'bg-teal-50 text-teal-600', red: 'bg-danger-50 text-danger', amber: 'bg-warning-50 text-warning', gray: 'bg-alabaster-200/70 text-graphite', green: 'bg-success-50 text-success', dark: 'bg-yale text-white' };
export const Badge = ({ className, tone = 'teal', icon: Icon, children, ...p }) => (
  <span className={cn('inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none', TONES[tone], className)} {...p}>
    {Icon && <Icon size={12} aria-hidden="true" className="shrink-0" />}<span className="min-w-0 break-words">{children}</span>
  </span>
);

export const StatCard = ({ icon: Icon, label, value, hint, tone = 'teal' }) => (
  <Card className="flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4 md:p-5">
    {Icon && <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12', TONES[tone])}><Icon size={22} aria-hidden="true" /></span>}
    <div className="min-w-0">
      <div className="text-sm leading-tight text-muted">{label}</div>
      <div className="text-2xl font-bold tabular-nums text-ink">{value}</div>
      {hint && <div className="text-sm text-muted">{hint}</div>}
    </div>
  </Card>
);
