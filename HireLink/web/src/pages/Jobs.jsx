import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, MapPin, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Badge, Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, Avatar, EmptyState, PageHeader, ScoreRing, SkeletonCards } from '@/components/ui/kit';
import { IlluSearch } from '@/components/illustrations';

const DEMO = [
  { id: 'd1', title: 'Lead Frontend Engineer', location: 'Paris', work_mode: 'hybrid', type: 'job', salary_min: 65000, salary_max: 75000, required_skills: ['React', 'TypeScript', 'Node.js'], companies: { name: 'Nexora Tech' } },
  { id: 'd2', title: 'Stage Data Analyst', location: 'Lyon', work_mode: 'remote', type: 'internship', required_skills: ['SQL', 'Python', 'Power BI'], companies: { name: 'QuantLogic' } },
  { id: 'd3', title: 'Lead DevOps & Cloud Engineer', location: 'Paris', work_mode: 'hybrid', type: 'job', salary_min: 75000, salary_max: 90000, required_skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD'], companies: { name: 'NovaTech Solutions' } },
];
const Chips = ({ label, options, value, onChange }) => (
  <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
    <span className="text-sm font-medium text-muted">{label}</span>
    {options.map(([v, text]) => (
      <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
        className={`min-h-10 rounded-full border px-4 text-sm font-medium transition-colors ${value === v ? 'border-yale bg-yale text-white' : 'border-line bg-white text-ink hover:border-yale/40'}`}>{text}</button>
    ))}
  </div>
);

export default function Jobs() {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const [jobs, setJobs] = useState(null);
  const [state, setState] = useState({}); // jobId -> { match } | { error, profile }
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    const id = setTimeout(async () => {
      setJobs(null);
      try {
        if (!supabaseConfigured) return setJobs(DEMO.filter((j) => j.title.toLowerCase().includes(q.toLowerCase()) && (!type || j.type === type) && (!mode || j.work_mode === mode)));
        const qs = new URLSearchParams({ ...(q && { q }), ...(type && { type }), ...(mode && { work_mode: mode }) });
        setJobs((await api.get(`/jobs?${qs}`)).data);
      } catch { setJobs([]); }
    }, 250);
    return () => clearTimeout(id);
  }, [q, type, mode]);

  async function apply(job) {
    if (!supabaseConfigured) return setState((s) => ({ ...s, [job.id]: { error: t('auth.demo') } }));
    setBusy(job.id);
    try { const { data } = await api.post('/applications', { job_id: job.id }); setState((s) => ({ ...s, [job.id]: { match: data.match } })); }
    catch (e) { setState((s) => ({ ...s, [job.id]: { error: e.message, profile: /profil/i.test(e.message) } })); }
    finally { setBusy(null); }
  }
  const reset = () => { setQ(''); setType(''); setMode(''); };
  const filtered = q || type || mode;

  return (
    <div className="space-y-6">
      <PageHeader title={t('jobs.title')} description={t('jobs.desc')} />
      <Card className="space-y-4">
        <div>
          <label htmlFor="job-search" className="label">{t('jobs.search')}</label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input id="job-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('jobs.searchPh')} className="input ps-10" />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Chips label={t('jobs.type')} value={type} onChange={setType} options={[['', t('jobs.all')], ['job', t('jobs.job')], ['internship', t('jobs.internship')]]} />
          <Chips label={t('jobs.mode')} value={mode} onChange={setMode} options={[['', t('jobs.all')], ['onsite', t('jobs.onsite')], ['hybrid', t('jobs.hybrid')], ['remote', t('jobs.remote')]]} />
        </div>
      </Card>

      <div className="flex min-h-6 items-center justify-between" aria-live="polite">
        {jobs && <p className="text-sm font-medium text-muted">{t('jobs.results', { n: jobs.length })}</p>}
        {filtered && <button onClick={reset} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-teal-600 hover:underline"><X size={14} aria-hidden="true" />{t('jobs.reset')}</button>}
      </div>

      {jobs === null && <SkeletonCards n={3} className="h-36" />}
      {jobs?.length === 0 && <EmptyState illustration={IlluSearch} title={t('jobs.emptyTitle')} description={t('jobs.emptyDesc')} action={filtered && <Button variant="outline" onClick={reset}>{t('jobs.reset')}</Button>} />}
      <ul className="grid gap-4 lg:grid-cols-2">
        {jobs?.map((j) => {
          const s = state[j.id] || {};
          const extra = (j.required_skills || []).length - 4;
          return (
            <li key={j.id}>
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Avatar name={j.companies?.name} className="h-12 w-12 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold leading-snug">{j.title}</h2>
                    <p className="text-sm text-muted">{j.companies?.name}</p>
                  </div>
                  <Badge tone={j.type === 'internship' ? 'amber' : 'teal'}>{t(`jobs.${j.type || 'job'}`)}</Badge>
                </div>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  {j.location && <span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden="true" />{j.location}</span>}
                  <span>{t(`jobs.${j.work_mode}`)}</span>
                  {j.salary_min && <span className="font-medium tabular-nums text-ink">{t('jobs.salary', { min: Number(j.salary_min).toLocaleString(i18n.language), max: Number(j.salary_max || j.salary_min).toLocaleString(i18n.language) })}</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(j.required_skills || []).slice(0, 4).map((k) => <Badge key={k} tone="gray">{k}</Badge>)}
                  {extra > 0 && <Badge tone="gray">{t('jobs.moreSkills', { n: extra })}</Badge>}
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  {s.match ? (
                    <div className="flex items-center gap-3"><ScoreRing value={s.match.score} />
                      <div className="text-sm"><div className="flex items-center gap-1 font-semibold text-success"><Check size={16} aria-hidden="true" />{t('jobs.applied')}</div>
                        {s.match.missing_skills?.length > 0 && <div className="text-muted">{t('flow.missing')} : {s.match.missing_skills.join(', ')}</div>}</div></div>
                  ) : <Button variant="accent" loading={busy === j.id} onClick={() => apply(j)}>{t('jobs.apply')}</Button>}
                  {s.error && <div className="w-full"><Alert tone="error">{s.error} {s.profile && <Link to="/app/profile" className="font-semibold underline">{t('nav.profile')}</Link>}</Alert></div>}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
