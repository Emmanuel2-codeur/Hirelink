import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const field = 'w-full rounded-lg border border-alabaster-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal';

export default function CandidateProfile() {
  const { t } = useTranslation();
  const [f, setF] = useState({ headline: '', location: '', skills: '', experience_years: 0, bio: '' });
  const [msg, setMsg] = useState('');
  const [cv, setCv] = useState({ busy: false, result: null, error: '' });
  const fileRef = useRef(null);
  const fill = (data) => data && setF({
    headline: data.headline || '', location: data.location || '', skills: (data.skills || []).join(', '),
    experience_years: data.experience_years || 0, bio: data.bio || '' });
  useEffect(() => {
    if (!supabaseConfigured) return;
    api.get('/candidates/me').then(({ data }) => fill(data)).catch(() => {});
  }, []);

  async function onCv(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setCv({ busy: true, result: null, error: '' });
    try {
      const fd = new FormData(); fd.append('cv', file);
      const { data } = await api.upload('/candidates/me/cv', fd);
      fill(data.profile);            // le formulaire se remplit avec les compétences extraites
      setCv({ busy: false, result: data, error: '' });
    } catch (err) { setCv({ busy: false, result: null, error: err.message }); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save(e) {
    e.preventDefault(); setMsg('');
    try {
      await api.put('/candidates/me', {
        headline: f.headline, location: f.location, bio: f.bio, experience_years: Number(f.experience_years) || 0,
        skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean) });
      setMsg(t('flow.saved'));
    } catch (err) { setMsg('⚠ ' + err.message); }
  }
  if (!supabaseConfigured) return <p className="text-sm">{t('common.soon')} (Supabase)</p>;
  return (
    <form onSubmit={save} className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-yale">{t('flow.profile')}</h1>
      <Card className="space-y-3">
        <CardTitle>{t('flow.cvTitle')}</CardTitle>
        <p className="text-xs text-graphite/60">{t('flow.cvHelp')}</p>
        <input ref={fileRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onCv} disabled={cv.busy} className="hidden" id="cv-input" />
        <Button type="button" variant="outline" disabled={cv.busy} onClick={() => fileRef.current?.click()}>{cv.busy ? t('flow.cvAnalyzing') : t('flow.cvChoose')}</Button>
        {cv.error && <p className="text-sm text-red-600">⚠ {cv.error}</p>}
        {cv.result && (
          <div className="space-y-2 rounded-lg bg-teal-50 p-3 text-sm">
            <p className="font-medium text-teal">{t('flow.cvDone')}</p>
            <p>{t('flow.cvClarity')} : <b>{cv.result.analysis.clarity}/100</b> · <span className="text-graphite/70">{cv.result.analysis.source === 'ai' ? t('flow.cvAi') : t('flow.cvKeywords')}</span></p>
            <div><span className="text-xs text-graphite/70">{t('flow.cvSkills')}</span>
              <div className="mt-1 flex flex-wrap gap-1">{cv.result.analysis.skills.map((k) => <Badge key={k}>{k}</Badge>)}</div></div>
            {cv.result.stored && <p className="text-xs text-graphite/60">{t('flow.cvStored')}</p>}
          </div>
        )}
      </Card>
      <Card className="space-y-3">
        <label className="block text-sm font-medium">{t('flow.headline')}<input className={field} value={f.headline} onChange={set('headline')} /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium">{t('flow.location')}<input className={field} value={f.location} onChange={set('location')} /></label>
          <label className="text-sm font-medium">{t('flow.experience')}<input type="number" min="0" className={field} value={f.experience_years} onChange={set('experience_years')} /></label>
        </div>
        <label className="block text-sm font-medium">{t('flow.skills')}<input className={field} value={f.skills} onChange={set('skills')} placeholder="React, Node.js, Docker" /></label>
        <label className="block text-sm font-medium">{t('flow.bio')}<textarea rows={4} className={field} value={f.bio} onChange={set('bio')} /></label>
      </Card>
      <div className="flex items-center gap-3"><Button variant="accent">{t('flow.save')}</Button>{msg && <span className="text-sm">{msg}</span>}</div>
    </form>
  );
}
