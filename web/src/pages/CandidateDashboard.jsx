import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Briefcase, CalendarClock, Check, Circle, FileText, MapPin, MessageSquare, Sparkles, Upload, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, EmptyState, Skeleton } from '@/components/ui/kit';
import { IlluCalendar, IlluSearch, Ribbon } from '@/components/illustrations';

const tomorrow = new Date(Date.now() + 86400000); tomorrow.setHours(14, 30, 0, 0);
const DEMO = {
  apps: [
    { id: 'a1', status: 'interview', job_offers: { title: 'Lead Data Analyst', companies: { name: 'DeepSignal Labs' } } },
    { id: 'a2', status: 'in_review', job_offers: { title: 'Full Stack Architect', companies: { name: 'QuantLogic' } } },
    { id: 'a3', status: 'submitted', job_offers: { title: 'Senior ML Engineer', companies: { name: 'Mistral AI' } } },
  ],
  profile: { headline: 'Data & IA', location: 'Paris', skills: ['Python', 'SQL', 'Docker', 'PyTorch', 'Pandas'], bio: 'x', cv_url: 'x', experience_years: 4 },
  interviews: [{ id: 'i1', status: 'scheduled', type: 'video', scheduled_at: tomorrow.toISOString(), job_offers: { title: 'Lead Data Analyst', companies: { name: 'DeepSignal Labs' } } }],
  jobs: [
    { id: 'j1', title: 'Lead Data Scientist', location: 'Paris', work_mode: 'hybrid', required_skills: ['PyTorch', 'MLOps'], companies: { name: 'DataRobot FR' } },
    { id: 'j2', title: 'Senior ML Engineer', location: 'Paris', work_mode: 'remote', required_skills: ['LLM', 'C++'], companies: { name: 'Mistral AI' } },
    { id: 'j3', title: 'Architecte Cloud Data', location: 'Lyon', work_mode: 'onsite', required_skills: ['Kubernetes', 'AWS'], companies: { name: 'OVH Cloud' } },
  ],
};
const CHECKS = [['headline', (p) => p?.headline], ['location', (p) => p?.location], ['skills', (p) => p?.skills?.length], ['bio', (p) => p?.bio], ['cv', (p) => p?.cv_url]];
const tone = (s) => (s === 'rejected' ? 'red' : s === 'accepted' ? 'green' : s === 'interview' ? 'teal' : 'gray');

export default function CandidateDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(supabaseConfigured ? null : DEMO);

  useEffect(() => {
    if (!supabaseConfigured) return;
    Promise.allSettled([api.get('/applications/mine'), api.get('/candidates/me'), api.get('/interviews'), api.get('/jobs?limit=3')])
      .then(([a, p, i, j]) => setData({ apps: a.value?.data || [], profile: p.value?.data || null, interviews: i.value?.data || [], jobs: j.value?.data || [] }));
  }, []);

  const chat = async (a) => { try { const { data: c } = await api.post('/conversations', { application_id: a.id }); nav(`/app/messages?c=${c.id}`); } catch { /* sans effet */ } };
  const view = useMemo(() => {
    if (!data) return null;
    const active = data.apps.filter((a) => !['accepted', 'rejected'].includes(a.status));
    const next = data.interviews.filter((i) => i.status === 'scheduled' && new Date(i.scheduled_at) >= Date.now()).sort((x, y) => new Date(x.scheduled_at) - new Date(y.scheduled_at))[0];
    const done = CHECKS.filter(([, f]) => f(data.profile)).length;
    return { active, next, done };
  }, [data]);

  if (!view) return (
    <div className="space-y-6" role="status" aria-label={t('common.loading')}>
      <Skeleton className="h-40" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-72" />
    </div>
  );
  const { active, next, done } = view;

  return (
    <div className="space-y-6">
      {/* Bandeau d'accueil : l'action principale est évidente */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-yale-900 p-6 text-white md:p-8">
        <Ribbon className="absolute inset-x-0 bottom-0 -z-10 h-32 w-full" />
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{t('dash.hello', { name: `\u2068${user.name}\u2069` })}</h1>
            <p className="mt-1 text-white/85">{t('dash.summary', { n: active.length })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="mint"><Link to="/app/jobs"><Briefcase size={18} aria-hidden="true" />{t('dash.browse')}</Link></Button>
            <Button asChild variant="outlineOnDark"><Link to="/app/profile"><Upload size={18} aria-hidden="true" />{t('dash.uploadCv')}</Link></Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard icon={FileText} label={t('dash.activeApps')} value={active.length} />
        <StatCard icon={CalendarClock} label={t('dash.interviews')} value={data.interviews.filter((i) => i.status === 'scheduled').length} tone="green" />
        <StatCard icon={Sparkles} label={t('dash.skillsCount')} value={data.profile?.skills?.length || 0} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Candidatures */}
        <div className="space-y-6 lg:col-span-2">
        <section className="space-y-3" aria-labelledby="apps-t">
          <div className="flex items-center justify-between"><CardTitle id="apps-t">{t('flow.myApps')}</CardTitle>
            {data.apps.length > 0 && <Link to="/app/jobs" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-600 hover:underline">{t('dash.viewOffer')}</Link>}</div>
          {data.apps.length === 0 ? (
            <EmptyState illustration={IlluSearch} title={t('dash.noApps')} description={t('dash.noAppsDesc')} action={<Button asChild variant="accent"><Link to="/app/jobs">{t('dash.browse')}</Link></Button>} />
          ) : (
            <ul className="space-y-3">
              {data.apps.map((a) => (
                <li key={a.id}><Card className="flex flex-wrap items-center gap-3 p-4">
                  <Avatar name={a.job_offers?.companies?.name} className="rounded-xl" />
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold">{a.job_offers?.title}</div><div className="truncate text-sm text-muted">{a.job_offers?.companies?.name}</div></div>
                  <Badge tone={tone(a.status)}>{t(`status.${a.status}`)}</Badge>
                  <Button variant="outline" size="sm" onClick={() => chat(a)}><MessageSquare size={16} aria-hidden="true" />{t('messages.start')}</Button>
                </Card></li>
              ))}
            </ul>
          )}
        </section>

        {/* Offres récentes */}
        {data.jobs.length > 0 && (
          <section aria-labelledby="jobs-t" className="space-y-3">
            <div className="flex items-center justify-between"><CardTitle id="jobs-t">{t('dash.recentJobs')}</CardTitle><Link to="/app/jobs" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-teal-600 hover:underline">{t('dash.seeAll')}<ArrowRight size={16} className="rtl-flip" aria-hidden="true" /></Link></div>
            <ul className="space-y-3">
              {data.jobs.map((j) => (
                <li key={j.id}><Link to="/app/jobs" className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-card transition-colors hover:border-teal/50">
                  <Avatar name={j.companies?.name} className="rounded-xl" />
                  <div className="min-w-0 flex-1"><div className="truncate font-semibold">{j.title}</div>
                    <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted"><span>{j.companies?.name}</span><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden="true" />{j.location}, {t(`jobs.${j.work_mode}`)}</span></div></div>
                  <div className="flex flex-wrap gap-1.5">{(j.required_skills || []).slice(0, 2).map((x) => <Badge key={x} tone="gray">{x}</Badge>)}</div>
                </Link></li>
              ))}
            </ul>
          </section>
        )}
        </div>

        {/* Colonne latérale : entretien + profil */}
        <div className="space-y-6">
          <section aria-labelledby="int-t" className="space-y-3">
            <CardTitle id="int-t">{t('dash.nextInterview')}</CardTitle>
            {next ? (
              <Card className="border-teal/30 bg-teal-50">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-600"><Video size={16} aria-hidden="true" />{t(`interviews.${next.type || 'video'}`)}</div>
                <div className="mt-1 text-lg font-bold">{next.job_offers?.title}</div>
                <div className="text-sm text-muted">{next.job_offers?.companies?.name}</div>
                <div className="mt-3 text-base font-semibold">{new Date(next.scheduled_at).toLocaleString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
                <Button asChild variant="outline" size="sm" className="mt-3"><Link to="/app/interviews">{t('nav.interviews')}</Link></Button>
              </Card>
            ) : <EmptyState compact illustration={IlluCalendar} title={t('dash.noInterview')} description={t('dash.noInterviewDesc')} />}
          </section>

          <Card aria-labelledby="prof-t">
            <div className="flex items-center justify-between"><CardTitle id="prof-t">{t('dash.profileTitle')}</CardTitle><span className="text-sm font-semibold tabular-nums text-muted">{t('dash.profileDone', { done, total: CHECKS.length })}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-alabaster-200" role="progressbar" aria-label={t('dash.profileTitle')} aria-valuenow={done} aria-valuemin={0} aria-valuemax={CHECKS.length}><div className="h-full rounded-full bg-teal transition-all" style={{ width: `${(done / CHECKS.length) * 100}%` }} /></div>
            <ul className="mt-4 space-y-1">
              {CHECKS.map(([k, f]) => {
                const ok = !!f(data.profile);
                return <li key={k} className={`flex min-h-9 items-center gap-2 text-sm ${ok ? 'text-muted' : 'font-medium text-ink'}`}>
                  {ok ? <Check size={18} className="text-success" aria-hidden="true" /> : <Circle size={18} className="text-muted" aria-hidden="true" />}
                  <span>{t(`dash.chk.${k}`)}</span></li>;
              })}
            </ul>
            {done < CHECKS.length && <Button asChild variant="accent" size="sm" className="mt-3 w-full"><Link to="/app/profile">{t('dash.completeProfile')}</Link></Button>}
          </Card>
        </div>
      </div>

    </div>
  );
}
