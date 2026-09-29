import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const field = 'w-full rounded-lg border border-alabaster-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal';
const STATUSES = ['submitted', 'in_review', 'shortlisted', 'interview', 'accepted', 'rejected'];

function CompanySetup({ onDone }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ name: '', sector: '', location: '', siret: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    try { await api.post('/companies', f); onDone(); } catch (x) { setErr(x.message); }
  }
  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-3">
      <h1 className="text-2xl font-bold text-yale">{t('flow.companyTitle')}</h1>
      <Card className="space-y-3">
        <input required className={field} placeholder={t('flow.companyName')} value={f.name} onChange={set('name')} />
        <input className={field} placeholder={t('flow.sector')} value={f.sector} onChange={set('sector')} />
        <input className={field} placeholder={t('flow.location')} value={f.location} onChange={set('location')} />
        <input className={field} placeholder={t('flow.siret')} value={f.siret} onChange={set('siret')} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button variant="accent" className="w-full">{t('flow.createCompany')}</Button>
      </Card>
    </form>
  );
}

export default function RecruiterLive() {
  const { t } = useTranslation();
  const [company, setCompany] = useState(undefined); // undefined = chargement, null = aucune
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [err, setErr] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const c = (await api.get('/companies/mine')).data;
      setCompany(c[0] || null);
      if (c[0]) setJobs((await api.get('/jobs/mine')).data);
    } catch (e) { setErr(e.message); setCompany(null); }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const openJob = async (job) => {
    setSelected(job);
    try { setApplicants((await api.get(`/applications/job/${job.id}`)).data.sort((a, b) => (b.matching_results?.[0]?.score ?? b.matching_results?.score ?? 0) - (a.matching_results?.[0]?.score ?? a.matching_results?.score ?? 0))); }
    catch (e) { setErr(e.message); }
  };
  const toggleJob = async (job) => {
    const status = job.status === 'published' ? 'suspended' : 'published';
    await api.patch(`/jobs/${job.id}/status`, { status }); loadAll();
  };
  const setStatus = async (a, status) => {
    await api.patch(`/applications/${a.id}/status`, { status });
    setApplicants((l) => l.map((x) => (x.id === a.id ? { ...x, status } : x)));
  };
  const scoreOf = (a) => { const m = Array.isArray(a.matching_results) ? a.matching_results[0] : a.matching_results; return m ? m : null; };

  if (company === undefined) return <p>{t('common.loading')}</p>;
  if (company === null) return <>{err && <p className="mb-2 text-sm text-red-600">{err}</p>}<CompanySetup onDone={loadAll} /></>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-yale">{company.name}</h1>
          {company.verification_status !== 'verified' && <Badge tone="amber">{t('flow.pendingVerif')}</Badge>}</div>
        <Button asChild><Link to="/app/offers/new"><Plus size={16} /> {t('offer.new')}</Link></Button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          <CardTitle>{t('flow.myOffers')}</CardTitle>
          {jobs.length === 0 && <p className="text-sm text-graphite/60">{t('flow.noOffers')}</p>}
          {jobs.map((j) => (
            <Card key={j.id} className={`cursor-pointer space-y-2 ${selected?.id === j.id ? 'ring-2 ring-teal' : ''}`} onClick={() => openJob(j)}>
              <div className="flex items-start justify-between gap-2"><b>{j.title}</b><Badge tone={j.status === 'published' ? 'teal' : 'gray'}>{t(`status.${j.status}`)}</Badge></div>
              <div className="flex items-center justify-between text-xs text-graphite/60">
                <span>{j.applications_count} {t('flow.applicants').toLowerCase()}</span>
                {['draft', 'published', 'suspended'].includes(j.status) && (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); toggleJob(j); }}>{j.status === 'published' ? t('flow.suspend') : t('flow.publish')}</Button>)}
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-3 lg:col-span-3">
          <CardTitle>{t('flow.applicants')}{selected ? ` — ${selected.title}` : ''}</CardTitle>
          {!selected && <p className="text-sm text-graphite/60">{t('flow.selectOffer')}</p>}
          {selected && applicants.length === 0 && <p className="text-sm text-graphite/60">{t('flow.noApplicants')}</p>}
          {applicants.map((a) => {
            const m = scoreOf(a);
            return (
              <Card key={a.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><b>{a.candidate_profiles?.profiles?.full_name || '—'}</b>
                    <div className="text-xs text-graphite/60">{a.candidate_profiles?.headline} · {a.candidate_profiles?.experience_years} ans</div></div>
                  {m && <Badge>{m.score}% {t('dash.match')}</Badge>}
                </div>
                {m && <div className="flex flex-wrap gap-1">{(m.matched_skills || []).map((s) => <Badge key={s}>{s}</Badge>)}{(m.missing_skills || []).map((s) => <Badge key={s} tone="red">✕ {s}</Badge>)}</div>}
                <select className={field + ' !py-1.5'} value={a.status} onChange={(e) => setStatus(a, e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                </select>
              </Card>
            );
          })}
          <p className="text-xs text-graphite/60">{t('landing.neutral')}</p>
        </div>
      </div>
    </div>
  );
}
