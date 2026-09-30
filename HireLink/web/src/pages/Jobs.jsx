import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Badge, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DEMO = [{ id: 'd1', title: 'Lead Frontend Engineer', location: 'Paris', work_mode: 'hybrid', type: 'job', companies: { name: 'Nexora Tech' } }, { id: 'd2', title: 'Stage Data Analyst', location: 'Lyon', work_mode: 'remote', type: 'internship', companies: { name: 'QuantLogic' } }];

export default function Jobs() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({}); // jobId -> { match } | { error }

  useEffect(() => {
    const id = setTimeout(async () => {
      setLoading(true);
      try { setJobs(supabaseConfigured ? (await api.get(`/jobs?q=${encodeURIComponent(q)}`)).data : DEMO.filter((j) => j.title.toLowerCase().includes(q.toLowerCase()))); }
      catch { setJobs([]); } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  async function apply(job) {
    if (!supabaseConfigured) return setState((s) => ({ ...s, [job.id]: { error: 'Mode démo' } }));
    try {
      const { data } = await api.post('/applications', { job_id: job.id });
      setState((s) => ({ ...s, [job.id]: { match: data.match } }));
    } catch (e) {
      setState((s) => ({ ...s, [job.id]: { error: e.message, profile: /profil/i.test(e.message), dup: /postul/i.test(e.message) } }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative"><Search size={16} className="absolute start-3 top-3 text-graphite/50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('nav.offers') + '…'} className="w-full rounded-lg border border-alabaster-200 bg-white py-2 pe-3 ps-9 text-sm focus:outline-none focus:ring-2 focus:ring-teal" /></div>
      {loading && <p className="text-sm">{t('common.loading')}</p>}
      {jobs.map((j) => {
        const s = state[j.id] || {};
        return (
          <Card key={j.id} className="flex flex-wrap items-center justify-between gap-3">
            <div><div className="font-semibold">{j.title}</div><div className="text-xs text-graphite/60">{j.companies?.name} · {j.location}</div>
              <div className="mt-1 flex gap-1"><Badge tone="gray">{j.work_mode}</Badge><Badge>{j.type}</Badge>{(j.required_skills || []).slice(0, 4).map((k) => <Badge key={k} tone="gray">{k}</Badge>)}</div></div>
            <div className="text-end text-sm">
              {s.match ? (
                <div><Badge>{t('flow.applied')} · {s.match.score}% {t('dash.match')}</Badge>
                  {s.match.missing_skills?.length > 0 && <div className="mt-1 text-xs text-graphite/60">{t('flow.missing')} : {s.match.missing_skills.join(', ')}</div>}</div>
              ) : (
                <Button variant="accent" size="sm" onClick={() => apply(j)}>{t('dash.apply')}</Button>
              )}
              {s.error && <div className="mt-1 max-w-56 text-xs text-red-600">{s.error} {s.profile && <Link to="/app/profile" className="underline">{t('nav.profile')}</Link>}</div>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
