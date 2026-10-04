import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, Building2, Check, FileText, Users, X } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Badge, Card, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, Avatar, EmptyState, PageHeader } from '@/components/ui/kit';
import { IlluShield } from '@/components/illustrations';

const DEMO = {
  stats: { users: 1284, companies: 96, offers: 312, applications: 4870 },
  pending: [
    { id: 'c1', name: 'Banque Privée Albatros', sector: 'Finance', location: 'Lyon', siret: '412 889 014 00018' },
    { id: 'c2', name: 'TalentPulse Consulting', sector: 'Conseil RH', location: 'Bordeaux', siret: '810 442 120 00011' },
  ],
  logs: [{ id: 'l1', action: 'company.verified', created_at: new Date(Date.now() - 3600e3).toISOString() }, { id: 'l2', action: 'company.rejected', created_at: new Date(Date.now() - 86400e3).toISOString() }],
};

export default function AdminLive() {
  const { t, i18n } = useTranslation();
  const demo = !supabaseConfigured;
  const [stats, setStats] = useState(demo ? DEMO.stats : null);
  const [pending, setPending] = useState(demo ? DEMO.pending : null);
  const [logs, setLogs] = useState(demo ? DEMO.logs : null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    if (demo) return;
    try {
      const [s, p, l] = await Promise.all([api.get('/admin/stats'), api.get('/admin/companies/pending'), api.get('/admin/audit-logs')]);
      setStats(s.data); setPending(p.data); setLogs(l.data); setErr('');
    } catch (e) { setErr(e.message); setPending((x) => x || []); setLogs((x) => x || []); }
  }, [demo]);
  useEffect(() => { load(); }, [load]);

  const decide = async (c, status) => {
    setBusy(c.id);
    try {
      if (demo) { setPending((l) => l.filter((x) => x.id !== c.id)); setLogs((l) => [{ id: c.id + status, action: `company.${status}`, created_at: new Date().toISOString() }, ...l]); }
      else { await api.patch(`/admin/companies/${c.id}`, { status }); await load(); }
    } catch (e) { setErr(e.message); } finally { setBusy(null); }
  };
  const fmt = (d) => new Date(d).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });
  const val = (v) => (v == null ? '…' : Number(v).toLocaleString(i18n.language));

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.title')} description={t('admin.desc')} />
      <Alert tone="error">{err}</Alert>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label={t('admin.users')} value={val(stats?.users)} />
        <StatCard icon={Building2} label={t('admin.companiesCount')} value={val(stats?.companies)} tone="green" />
        <StatCard icon={Briefcase} label={t('admin.offers')} value={val(stats?.offers)} tone="amber" />
        <StatCard icon={FileText} label={t('admin.applications')} value={val(stats?.applications)} />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <section aria-labelledby="pend-t" className="space-y-3 lg:col-span-3">
          <div className="flex items-center gap-2"><CardTitle id="pend-t">{t('admin.companies')}</CardTitle>{pending && <Badge tone="amber">{pending.length}</Badge>}</div>
          <p className="-mt-1 text-sm text-muted">{t('admin.pendingDesc')}</p>
          {pending?.length === 0 && <EmptyState illustration={IlluShield} title={t('admin.pendingNone')} description={t('admin.pendingNoneDesc')} />}
          <ul className="space-y-3">
            {pending?.map((c) => (
              <li key={c.id}><Card className="flex flex-wrap items-center gap-3">
                <Avatar name={c.name} className="h-12 w-12 rounded-xl" />
                <div className="min-w-0 flex-1"><div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-muted">{[c.sector, c.location].filter(Boolean).join(' · ')}</div>
                  {c.siret && <div className="text-sm tabular-nums text-muted">SIRET {c.siret}</div>}</div>
                <div className="flex gap-2">
                  <Button variant="outline" loading={busy === c.id} onClick={() => decide(c, 'rejected')}><X size={18} aria-hidden="true" />{t('admin.reject')}</Button>
                  <Button variant="accent" loading={busy === c.id} onClick={() => decide(c, 'verified')}><Check size={18} aria-hidden="true" />{t('admin.validate')}</Button>
                </div>
              </Card></li>
            ))}
          </ul>
        </section>
        <Card className="lg:col-span-2" aria-labelledby="log-t">
          <CardTitle id="log-t">{t('admin.audit')}</CardTitle>
          {logs?.length === 0 && <p className="mt-3 text-sm text-muted">{t('admin.logNone')}</p>}
          <ul className="mt-3 divide-y divide-line">
            {logs?.map((l) => {
              const status = (l.action || '').split('.')[1];
              return <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Badge tone={status === 'verified' ? 'green' : status === 'rejected' ? 'red' : 'gray'} icon={status === 'verified' ? Check : status === 'rejected' ? X : undefined}>{status ? t(`admin.${status}`) : l.action}</Badge>
                <time className="text-muted" dateTime={l.created_at}>{fmt(l.created_at)}</time></li>;
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
