import { cn } from '@/lib/utils';
export const Card = ({ className, ...p }) => <div className={cn('rounded-xl border border-alabaster-200 bg-white p-5 shadow-sm', className)} {...p} />;
export const CardTitle = ({ className, ...p }) => <h3 className={cn('text-base font-semibold text-graphite-900', className)} {...p} />;
export const Badge = ({ className, tone = 'teal', ...p }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    tone === 'teal' && 'bg-teal-50 text-teal', tone === 'red' && 'bg-red-50 text-red-700',
    tone === 'amber' && 'bg-amber-50 text-amber-700', tone === 'gray' && 'bg-alabaster-200/70 text-graphite', className)} {...p} />
);
export const StatCard = ({ icon: Icon, label, value, hint }) => (
  <Card>
    <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-graphite/60">
      {label}{Icon && <Icon size={18} className="text-teal" />}
    </div>
    <div className="mt-2 text-3xl font-bold text-graphite-900">{value}</div>
    {hint && <div className="mt-1 text-xs text-graphite/60">{hint}</div>}
  </Card>
);
