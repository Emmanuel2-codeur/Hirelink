import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, Check, Clock, FileText, MessageSquare, Plus, ShieldCheck, X } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Badge, Card, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, Avatar, EmptyState, PageHeader, ScoreRing, Skeleton } from '@/components/ui/kit';
import { IlluCompany, IlluInbox, IlluSearch } from '@/components/illustrations';

const STATUSES = ['submitted', 'in_review', 'shortlisted', 'interview', 'accepted', 'rejected'];
const DEMO = {
  company: { name: 'NovaTech Solutions', verification_status: 'verified' },
  jobs: [
    { id: 'j1', title: 'Lead DevOps & Cloud Engineer', status: 'published', applications_count: 3 },
    { id: 'j2', title: 'Stage Data Analyst', status: 'published', applications_count: 1 },
    { id: 'j3', title: 'Product Designer', status: 'draft', applications_count: 0 },
  ],
  applicants: [
    { id: 'p1', status: 'interview', candidate_profiles: { headline: 'Ingénieure Fullstack & DevOps', experience_years: 6, profiles: { full_name: 'Amina Benali' } }, matching_results: { score: 92, matched_skills: ['Kubernetes', 'Terraform', 'AWS'], missing_skills: [] } },
    { id: 'p2', status: 'shortlisted', candidate_profiles: { headline: 'Lead SRE', experience_years: 7, profiles: { full_name: 'Thomas Leroy' } }, matching_results: { score: 84, matched_skills: ['Kubernetes', 'AWS'], missing_skills: ['Terraform'] } },
    { id: 'p3', status: 'submitted', candidate_profiles: { headline: 'DevOps Engineer', experience_years: 3, profiles: { full_name: 'Julien Moreau' } }, matching_results: { score: 61, matched_skills: ['AWS'], missing_skills: ['Kubernetes', 'Terraform'] } },
  ],
};
const match = (a) => (Array.isArray(a.matching_results) ? a.matching_results[0] : a.matching_results) || null;
const byScore = (l) => [...l].sort((x, y) => (match(y)?.score ?? -1) - (match(x)?.score ?? -1));
const jobTone = (s) => (s === 'published' ? 'green' : s === 'suspended' ? 'red' : 'gray');

function CompanySetup({ onDone }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ name: '', sector: '', location: '', siret: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) { e.preventDefault(); setBusy(true); try { await api.post('/companies', f); onDone(); } catch (x) { setErr(x.message); setBusy(false); } }
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-line bg-white shadow-card md:grid-cols-2">
      <div className="hidden flex-col items-center justify-center bg-teal-50 p-8 md:flex"><IlluCompany className="h-48 w-auto" /><p className="mt-4 text-center text-sm text-muted">{t('rec.companyDesc')}</p></div>
      <form onSubmit={submit} className="space-y-4 p-6 md:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{t('flow.companyTitle')}</h1>
        <p className="text-sm text-muted md:hidden">{t('rec.companyDesc')}</p>
        <div><label htmlFor="c-name" className="label">{t('flow.companyName')}</label><input id="c-name" required autoComplete="organization" className="input" value={f.name} onChange={set('name')} /></div>
        <div><label htmlFor="c-sector" className="label">{t('flow.sector')}</label><input id="c-sector" className="input" value={f.sector} onChange={set('sector')} /></div>
        <div><label htmlFor="c-loc" className="label">{t('flow.location')}</label><input id="c-loc" autoComplete="address-level2" className="input" value={f.location} onChange={set('location')} /></div>
        <div><label htmlFor="c-siret" className="label">{t('flow.siret')}</label><input id="c-siret" inputMode="numeric" className="input" value={f.siret} onChange={set('siret')} /></div>
        <Alert tone="error">{err}</Alert>
        <Button variant="accent" size="lg" className="w-full" loading={busy}>{t('flow.createCompany')}</Button>
      </form>
    </div>
  );
}

function ScheduleForm({ application, onDone, demo }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ when: '', type: 'video', place: '', notes: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const id = `sch-${application.id}`;
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (!demo) await api.post('/interviews', { application_id: application.id, scheduled_at: new Date(f.when).toISOString(), type: f.type, location_or_link: f.place || undefined, notes: f.notes || undefined });
      onDone();
    } catch (x) { setErr(x.message); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-alabaster p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor={`${id}-w`} className="label">{t('interviews.date')}</label><input id={`${id}-w`} required type="datetime-local" className="input" value={f.when} onChange={set('when')} /></div>
        <div><label htmlFor={`${id}-t`} className="label">{t('interviews.type')}</label><select id={`${id}-t`} className="input" value={f.type} onChange={set('type')}>{['video', 'onsite', 'phone'].map((k) => <option key={k} value={k}>{t(`interviews.${k}`)}</option>)}</select></div>
      </div>
      <div><label htmlFor={`${id}-p`} className="label">{t('interviews.place')}</label><input id={`${id}-p`} className="input" value={f.place} onChange={set('place')} /></div>
      <div><label htmlFor={`${id}-n`} className="label">{t('interviews.notes')}</label><input id={`${id}-n`} className="input" value={f.notes} onChange={set('notes')} /></div>
      <Alert tone="error">{err}</Alert>
      <Button variant="accent" loading={busy}>{t('interviews.submit')}</Button>
    </form>
  );
}

export default function RecruiterLive() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const demo = !supabaseConfigured;
  const [company, setCompany] = useState(demo ? DEMO.company : undefined); // undefined = chargement, null = aucune
  const [jobs, setJobs] = useState(demo ? DEMO.jobs : []);
  const [selected, setSelected] = useState(demo ? DEMO.jobs[0] : null);
  const [applicants, setApplicants] = useState(demo ? byScore(DEMO.applicants) : null);
  const [err, setErr] = useState('');
  const [sched, setSched] = useState(null);
  const [planned, setPlanned] = useState({});
  const detail = useRef(null);

  const openJob = useCallback(async (job, scroll) => {
    setSelected(job); setApplicants(null); setSched(null);
    if (scroll && window.innerWidth < 1024) setTimeout(() => detail.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    if (demo) return setApplicants(job.id === 'j1' ? byScore(DEMO.applicants) : []);
    try { setApplicants(byScore((await api.get(`/applications/job/${job.id}`)).data)); } catch (e) { setErr(e.message); setApplicants([]); }
  }, [demo]);

  const loadAll = useCallback(async () => {
    if (demo) return;
    try {
      const c = (await api.get('/companies/mine')).data;
      setCompany(c[0] || null);
      if (c[0]) { const list = (await api.get('/jobs/mine')).data; setJobs(list); if (list[0]) openJob(list[0]); else setApplicants([]); }
    } catch (e) { setErr(e.message); setCompany(null); }
  }, [demo, openJob]);
  useEffect(() => { loadAll(); }, [loadAll]);

  const stats = useMemo(() => ({ published: jobs.filter((j) => j.status === 'published').length, received: jobs.reduce((n, j) => n + (j.applications_count || 0), 0), drafts: jobs.filter((j) => j.status === 'draft').length }), [jobs]);

  const toggleJob = async (job) => {
    const status = job.status === 'published' ? 'suspended' : 'published';
    if (demo) return setJobs((l) => l.map((j) => (j.id === job.id ? { ...j, status } : j)));
    try { await api.patch(`/jobs/${job.id}/status`, { status }); setJobs((l) => l.map((j) => (j.id === job.id ? { ...j, status } : j))); } catch (e) { setErr(e.message); }
  };
  const setStatus = async (a, status) => {
    try { if (!demo) await api.patch(`/applications/${a.id}/status`, { status }); setApplicants((l) => l.map((x) => (x.id === a.id ? { ...x, status } : x))); } catch (e) { setErr(e.message); }
  };
  const chat = async (a) => { if (demo) return; try { const { data } = await api.post('/conversations', { application_id: a.id }); nav(`/app/messages?c=${data.id}`); } catch (e) { setErr(e.message); } };

  if (company === undefined) return <div className="space-y-4" role="status" aria-label={t('common.loading')}><Skeleton className="h-16" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-80" /></div>;
  if (company === null) return <><Alert tone="error" className="mb-4">{err}</Alert><CompanySetup onDone={loadAll} /></>;
  const verified = company.verification_status === 'verified';

  return (
    <div className="space-y-6">
      <PageHeader title={company.name}
        description={verified ? <Badge tone="green" icon={ShieldCheck}>{t('rec.verified')}</Badge> : <Badge tone="amber" icon={Clock}>{t('flow.pendingVerif')}</Badge>}
        actions={<Button asChild><Link to="/app/offers/new"><Plus size={18} aria-hidden="true" />{t('nav.newOffer')}</Link></Button>} />
      <Alert tone="error">{err}</Alert>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard icon={Check} label={t('rec.published')} value={stats.published} tone="green" />
        <StatCard icon={FileText} label={t('rec.received')} value={stats.received} />
        <StatCard icon={Clock} label={t('rec.drafts')} value={stats.drafts} tone="amber" />
      </div>

      {jobs.length === 0 ? (
        <EmptyState illustration={IlluCompany} title={t('flow.noOffers')} description={t('rec.noOffersDesc')} action={<Button asChild variant="accent"><Link to="/app/offers/new">{t('nav.newOffer')}</Link></Button>} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <section aria-labelledby="offers-t" className="space-y-3">
            <CardTitle id="offers-t">{t('flow.myOffers')}</CardTitle>
            <ul className="space-y-3">
              {jobs.map((j) => (
                <li key={j.id} className={`overflow-hidden rounded-xl border bg-white shadow-card ${selected?.id === j.id ? 'border-teal ring-2 ring-teal/30' : 'border-line'}`}>
                  <button onClick={() => openJob(j, true)} aria-pressed={selected?.id === j.id} className="block w-full p-4 text-start hover:bg-alabaster">
                    <span className="flex items-start justify-between gap-2"><span className="font-semibold leading-snug">{j.title}</span><Badge tone={jobTone(j.status)}>{t(`status.${j.status}`)}</Badge></span>
                    <span className="mt-1 block text-sm text-muted">{t('rec.received')} : <b className="tabular-nums text-ink">{j.applications_count}</b></span>
                  </button>
                  {['draft', 'published', 'suspended'].includes(j.status) && (
                    <div className="border-t border-line px-4 py-2"><Button size="sm" variant="ghost" onClick={() => toggleJob(j)}>{j.status === 'published' ? t('flow.suspend') : t('flow.publish')}</Button></div>)}
                </li>
              ))}
            </ul>
            <Card className="space-y-3">
              <CardTitle as="h3" className="text-base">{t('offer.howScore')}</CardTitle>
              {[['scoreSkills', 60], ['scoreExp', 25], ['scorePlace', 15]].map(([k, w]) => (
                <div key={k} className="text-sm"><div className="flex justify-between"><span>{t(`offer.${k}`)}</span><b className="tabular-nums">{w} %</b></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-alabaster-200"><div className="h-full rounded-full bg-teal" style={{ width: `${w * 1.6}%` }} /></div></div>
              ))}
            </Card>
          </section>

          <section ref={detail} aria-labelledby="app-t" className="min-w-0 scroll-mt-4 space-y-3">
            <CardTitle id="app-t">{t('flow.applicants')}{selected ? ` — ${selected.title}` : ''}</CardTitle>
            {!selected && <EmptyState illustration={IlluSearch} title={t('flow.selectOffer')} description={t('rec.selectDesc')} />}
            {selected && applicants === null && <div className="space-y-3"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>}
            {selected && applicants?.length === 0 && <EmptyState illustration={IlluInbox} title={t('flow.noApplicants')} description={t('rec.noApplicantsDesc')} />}
            <ul className="space-y-3">
              {applicants?.map((a) => {
                const m = match(a); const name = a.candidate_profiles?.profiles?.full_name || '—';
                return (
                  <li key={a.id}><Card className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar name={name} className="h-12 w-12" />
                      <div className="min-w-0 flex-1"><div className="font-semibold">{name}</div>
                        <div className="text-sm text-muted">{[a.candidate_profiles?.headline, a.candidate_profiles?.experience_years != null && t('rec.yearsExp', { n: a.candidate_profiles.experience_years })].filter(Boolean).join(' · ')}</div></div>
                      {m && <div className="flex flex-col items-center gap-0.5"><ScoreRing value={m.score} size={52} /><span className="text-xs text-muted">{t('rec.scoreLabel')}</span></div>}
                    </div>
                    {m && <div className="flex flex-wrap gap-1.5">
                      {(m.matched_skills || []).map((s) => <Badge key={s} tone="green" icon={Check}>{s}</Badge>)}
                      {(m.missing_skills || []).map((s) => <Badge key={s} tone="red" icon={X}>{s}</Badge>)}</div>}
                    <div className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
                      <div className="min-w-44 flex-1"><label htmlFor={`st-${a.id}`} className="label">{t('rec.statusLabel')}</label>
                        <select id={`st-${a.id}`} className="input" value={a.status} onChange={(e) => setStatus(a, e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}</select></div>
                      <Button variant="outline" onClick={() => chat(a)}><MessageSquare size={18} aria-hidden="true" />{t('messages.start')}</Button>
                      {!planned[a.id] && <Button variant="outline" aria-expanded={sched === a.id} onClick={() => setSched(sched === a.id ? null : a.id)}><CalendarPlus size={18} aria-hidden="true" />{t('interviews.schedule')}</Button>}
                    </div>
                    {planned[a.id] && <Alert tone="success">{t('interviews.planned')}</Alert>}
                    {sched === a.id && <ScheduleForm application={a} demo={demo} onDone={() => { setSched(null); setPlanned((p) => ({ ...p, [a.id]: true })); setApplicants((l) => l.map((x) => (x.id === a.id ? { ...x, status: 'interview' } : x))); }} />}
                  </Card></li>
                );
              })}
            </ul>
            {applicants?.length > 0 && <p className="text-sm text-muted">{t('landing.trust3')}.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
