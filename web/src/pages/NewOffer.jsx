import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const schema = z.object({
  title: z.string().min(3),
  type: z.enum(['job', 'internship']),
  work_mode: z.enum(['onsite', 'hybrid', 'remote']),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  min_experience_years: z.coerce.number().int().min(0),
  match_threshold: z.coerce.number().int().min(50).max(95),
  missions: z.string().optional(),
});

export default function NewOffer() {
  const { t } = useTranslation();
  const [must, setMust] = useState(['Kubernetes', 'Terraform']);
  const [nice, setNice] = useState(['Datadog']);
  const [msg, setMsg] = useState('');
  const nav = useNavigate();
  const { register, handleSubmit, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'job', work_mode: 'hybrid', min_experience_years: 5, match_threshold: 80, salary_min: 75000, salary_max: 90000 },
  });
  const th = watch('match_threshold');
  const field = 'w-full rounded-lg border border-alabaster-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal';

  const submit = (status) => handleSubmit(async (v) => {
    try {
      if (!supabaseConfigured) return setMsg('Mode démo — offre non enregistrée : ' + JSON.stringify({ ...v, required_skills: must, status }).slice(0, 120) + '…');
      await api.post('/jobs', { ...v, required_skills: must, nice_to_have_skills: nice, status });
      nav('/app/recruiter');
    } catch (e) { setMsg('⚠ ' + e.message); }
  });

  const Tags = ({ list, setList, tone }) => (
    <div className="flex flex-wrap gap-1.5">
      {list.map((s) => <Badge key={s} tone={tone}>{s}<button type="button" onClick={() => setList(list.filter((x) => x !== s))} className="ms-1"><X size={12} /></button></Badge>)}
      <input placeholder="+" className="w-24 rounded-full border border-dashed px-2 text-xs" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) { e.preventDefault(); setList([...list, e.target.value.trim()]); e.target.value = ''; } }} />
    </div>
  );

  return (
    <form className="grid gap-6 lg:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-4 lg:col-span-2">
        <h1 className="text-2xl font-bold text-yale">{t('offer.new')}</h1>
        <Card className="space-y-3">
          <label className="block text-sm font-medium">{t('offer.jobTitle')}<input className={field} {...register('title')} placeholder="Lead DevOps & Cloud Engineer" /></label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">{t('offer.contract')}<select className={field} {...register('type')}><option value="job">CDI / CDD</option><option value="internship">Stage</option></select></label>
            <label className="text-sm font-medium">{t('offer.remote')}<select className={field} {...register('work_mode')}><option value="onsite">Sur site</option><option value="hybrid">Hybride</option><option value="remote">Remote</option></select></label>
            <label className="text-sm font-medium">{t('offer.salary')} (min)<input type="number" className={field} {...register('salary_min')} /></label>
            <label className="text-sm font-medium">{t('offer.salary')} (max)<input type="number" className={field} {...register('salary_max')} /></label>
          </div>
          <textarea rows={5} className={field} placeholder="Missions clés & contexte opérationnel…" {...register('missions')} />
        </Card>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={submit('draft')}>{t('offer.save')}</Button>
          <Button type="button" onClick={submit('published')}>{t('offer.publish')}</Button>
        </div>
        {msg && <p className="break-words text-sm text-graphite/70">{msg}</p>}
      </div>
      <div className="space-y-4">
        <Card className="space-y-3 bg-yale text-white">
          <CardTitle className="text-white">{t('offer.threshold')}: {th}%</CardTitle>
          <input type="range" min={50} max={95} className="w-full accent-teal" {...register('match_threshold')} />
          <label className="text-sm">Exp. min (ans)<input type="number" className="mt-1 w-full rounded-lg px-3 py-1.5 text-graphite" {...register('min_experience_years')} /></label>
        </Card>
        <Card className="space-y-2"><CardTitle>{t('offer.must')} <Badge tone="red">3x</Badge></CardTitle><Tags list={must} setList={setMust} tone="red" />
          <CardTitle className="pt-2">{t('offer.nice')} <Badge tone="gray">1x</Badge></CardTitle><Tags list={nice} setList={setNice} tone="gray" /></Card>
        <Card><CardTitle>{t('offer.pool')}</CardTitle><p className="mt-2 text-sm text-graphite/70">Maxime R. — <b className="text-teal">94%</b><br />Clara L. — <b className="text-teal">86%</b></p></Card>
      </div>
    </form>
  );
}
