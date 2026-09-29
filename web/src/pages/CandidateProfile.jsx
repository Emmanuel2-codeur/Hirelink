import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const field = 'w-full rounded-lg border border-alabaster-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal';

export default function CandidateProfile() {
  const { t } = useTranslation();
  const [f, setF] = useState({ headline: '', location: '', skills: '', experience_years: 0, bio: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!supabaseConfigured) return;
    api.get('/candidates/me').then(({ data }) => data && setF({
      headline: data.headline || '', location: data.location || '', skills: (data.skills || []).join(', '),
      experience_years: data.experience_years || 0, bio: data.bio || '' })).catch(() => {});
  }, []);
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
