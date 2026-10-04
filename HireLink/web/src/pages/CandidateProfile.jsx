import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Circle, FileUp, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, PageHeader, Skeleton } from '@/components/ui/kit';

const EMPTY = { headline: '', location: '', skills: '', experience_years: 0, bio: '', cv_url: '' };

export default function CandidateProfile() {
  const { t } = useTranslation();
  const [f, setF] = useState(EMPTY);
  const [loaded, setLoaded] = useState(!supabaseConfigured);
  const [msg, setMsg] = useState(null);           // { tone, text }
  const [saving, setSaving] = useState(false);
  const [cv, setCv] = useState({ busy: false, result: null });
  const fileRef = useRef(null);

  const fill = (d) => d && setF({ headline: d.headline || '', location: d.location || '', skills: (d.skills || []).join(', '), experience_years: d.experience_years || 0, bio: d.bio || '', cv_url: d.cv_url || '' });
  useEffect(() => {
    if (!supabaseConfigured) return;
    api.get('/candidates/me').then(({ data }) => fill(data)).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const skills = useMemo(() => f.skills.split(',').map((s) => s.trim()).filter(Boolean), [f.skills]);
  const checks = [['headline', f.headline], ['location', f.location], ['skills', skills.length], ['bio', f.bio], ['cv', f.cv_url]];
  const done = checks.filter(([, v]) => v).length;

  async function onCv(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setCv({ busy: true, result: null }); setMsg(null);
    try {
      const fd = new FormData(); fd.append('cv', file);
      const { data } = await api.upload('/candidates/me/cv', fd);
      fill(data.profile); setCv({ busy: false, result: data });
    } catch (err) { setCv({ busy: false, result: null }); setMsg({ tone: 'error', text: err.message }); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  }
  async function save(e) {
    e.preventDefault(); setMsg(null); setSaving(true);
    try {
      await api.put('/candidates/me', { headline: f.headline, location: f.location, bio: f.bio, experience_years: Number(f.experience_years) || 0, skills });
      setMsg({ tone: 'success', text: t('flow.saved') });
    } catch (err) { setMsg({ tone: 'error', text: err.message }); } finally { setSaving(false); }
  }

  if (!supabaseConfigured) return <div className="space-y-6"><PageHeader title={t('flow.profile')} description={t('profile.desc')} /><Alert tone="info">{t('auth.demo')}</Alert></div>;
  if (!loaded) return <div className="space-y-4"><Skeleton className="h-16" /><div className="grid gap-6 lg:grid-cols-5"><Skeleton className="h-96 lg:col-span-3" /><Skeleton className="h-96 lg:col-span-2" /></div></div>;

  return (
    <div className="space-y-6">
      <PageHeader title={t('flow.profile')} description={t('profile.desc')} />
      <div className="grid items-start gap-6 lg:grid-cols-5">
        <form onSubmit={save} className="space-y-5 lg:col-span-3">
          <Card className="space-y-5">
            <CardTitle>{t('profile.formTitle')}</CardTitle>
            <div><label htmlFor="headline" className="label">{t('flow.headline')}</label><input id="headline" className="input" value={f.headline} onChange={set('headline')} autoComplete="organization-title" /></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="city" className="label">{t('flow.location')}</label><input id="city" className="input" value={f.location} onChange={set('location')} autoComplete="address-level2" /></div>
              <div><label htmlFor="exp" className="label">{t('flow.experience')}</label><input id="exp" type="number" min="0" inputMode="numeric" className="input" value={f.experience_years} onChange={set('experience_years')} /></div>
            </div>
            <div>
              <label htmlFor="skills" className="label">{t('flow.skills')}</label>
              <input id="skills" className="input" value={f.skills} onChange={set('skills')} placeholder="React, Node.js, Docker" aria-describedby="skills-hint" />
              <p id="skills-hint" className="hint">{t('profile.skillsHint')}</p>
              {skills.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{skills.map((s) => <Badge key={s}>{s}</Badge>)}</div>}
            </div>
            <div><label htmlFor="bio" className="label">{t('flow.bio')}</label><textarea id="bio" rows={5} className="input" value={f.bio} onChange={set('bio')} /></div>
          </Card>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="accent" size="lg" loading={saving}>{t('flow.save')}</Button>
            {msg && <Alert tone={msg.tone} className="flex-1">{msg.text}</Alert>}
          </div>
        </form>

        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4">
            <CardTitle>{t('flow.cvTitle')}</CardTitle>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-alabaster px-4 py-6 text-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-teal-600"><FileUp size={22} aria-hidden="true" /></span><span className="text-sm text-muted">PDF · DOCX</span></div>
            <p className="text-sm text-muted">{t('profile.cvDesc')}</p>
            <input ref={fileRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onCv} disabled={cv.busy} className="sr-only" id="cv-input" aria-label={t('flow.cvChoose')} />
            <Button type="button" variant={f.cv_url ? 'outline' : 'default'} className="w-full" loading={cv.busy} onClick={() => fileRef.current?.click()}>
              {!cv.busy && <FileUp size={18} aria-hidden="true" />}{cv.busy ? t('flow.cvAnalyzing') : f.cv_url ? t('profile.replaceCv') : t('flow.cvChoose')}
            </Button>
            <p className="hint">{t('flow.cvHelp')}</p>
            {cv.result && (
              <div className="space-y-2 rounded-lg bg-teal-50 p-3 text-sm" role="status">
                <p className="flex items-center gap-2 font-semibold text-teal-600"><Sparkles size={16} aria-hidden="true" />{t('flow.cvDone')}</p>
                <p>{t('flow.cvClarity')} : <b className="tabular-nums">{cv.result.analysis.clarity}/100</b> · {cv.result.analysis.source === 'ai' ? t('flow.cvAi') : t('flow.cvKeywords')}</p>
              </div>
            )}
          </Card>
          <Card>
            <div className="flex items-center justify-between"><CardTitle>{t('profile.completeness')}</CardTitle><span className="text-sm font-semibold tabular-nums text-muted">{done}/{checks.length}</span></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-alabaster-200" role="progressbar" aria-label={t('profile.completeness')} aria-valuenow={done} aria-valuemin={0} aria-valuemax={checks.length}><div className="h-full rounded-full bg-teal transition-all" style={{ width: `${(done / checks.length) * 100}%` }} /></div>
            <ul className="mt-3 space-y-1">{checks.map(([k, v]) => <li key={k} className={`flex min-h-9 items-center gap-2 text-sm ${v ? 'text-muted' : 'font-medium'}`}>{v ? <Check size={18} className="text-success" aria-hidden="true" /> : <Circle size={18} className="text-muted" aria-hidden="true" />}{t(`dash.chk.${k}`)}</li>)}</ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
