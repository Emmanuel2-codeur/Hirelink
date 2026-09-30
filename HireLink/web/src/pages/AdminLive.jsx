import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Building2, FileText, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Card, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminLive() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [logs, setLogs] = useState([]);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, p, l] = await Promise.all([api.get('/admin/stats'), api.get('/admin/companies/pending'), api.get('/admin/audit-logs')]);
      setStats(s.data); setPending(p.data); setLogs(l.data); setErr('');
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const decide = async (c, status) => { await api.patch(`/admin/companies/${c.id}`, { status }); load(); };
  const fmt = (d) => new Date(d).toLocaleString(i18n.language);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-yale">{t('admin.title')}</h1>
      {err && <p className="text-sm text-red-600">⚠ {err}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t('admin.users')} value={stats?.users ?? '…'} />
        <StatCard icon={Building2} label={t('admin.companiesCount')} value={stats?.companies ?? '…'} />
        <StatCard icon={Briefcase} label={t('admin.offers')} value={stats?.offers ?? '…'} />
        <StatCard icon={FileText} label={t('admin.applications')} value={stats?.applications ?? '…'} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle>{t('admin.companies')} <Badge tone="amber">{pending.length}</Badge></CardTitle>
          {pending.length === 0 && <p className="text-sm text-graphite/60">{t('admin.pendingNone')}</p>}
          {pending.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-alabaster-200 p-3">
              <div><div className="font-medium">{c.name}</div>
                <div className="text-xs text-graphite/60">{[c.sector, c.location].filter(Boolean).join(' · ')}{c.siret ? ` · SIRET ${c.siret}` : ''}</div></div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => decide(c, 'rejected')}>{t('admin.reject')}</Button>
                <Button size="sm" onClick={() => decide(c, 'verified')}>{t('admin.validate')}</Button>
              </div>
            </div>
          ))}
        </Card>
        <Card className="space-y-2">
          <CardTitle>{t('admin.audit')}</CardTitle>
          {logs.length === 0 && <p className="text-sm text-graphite/60">{t('admin.noAudit')}</p>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between border-t border-alabaster-200 pt-2 text-sm">
              <Badge tone="gray">{l.action}</Badge><span className="text-xs text-graphite/60">{fmt(l.created_at)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
