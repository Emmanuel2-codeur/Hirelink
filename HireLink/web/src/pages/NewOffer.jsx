import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, PageHeader } from '@/components/ui/kit';

const schema = z.object({
  title: z.string().trim().min(3),
  type: z.enum(['job', 'internship']),
  work_mode: z.enum(['onsite', 'hybrid', 'remote']),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  min_experience_years: z.coerce.number().int().min(0),
  match_threshold: z.coerce.number().int().min(50).max(95),
  missions: z.string().optional(),
});

// Saisie de compétences : champ libellé + bouton « Ajouter » (Entrée fonctionne aussi), puces retirables au clavier.
function SkillInput({ id, label, list, setList, tone }) {
  const { t } = useTranslation();
  const [v, setV] = useState('');
  const add = () => { const s = v.trim(); if (s && !list.some((x) => x.toLowerCase() === s.toLowerCase())) setList([...list, s]); setV(''); };
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex gap-2">
        <input id={id} className="input" value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button type="button" variant="outline" onClick={add} aria-label={t('offer.add')}><Plus size={18} aria-hidden="true" /></Button>
      </div>
      {list.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {list.map((s) => (
            <li key={s} className={`inline-flex items-center gap-1 rounded-full py-1 ps-3 pe-1 text-xs font-semibold ${tone === 'red' ? 'bg-danger-50 text-danger' : 'bg-alabaster-200/70 text-graphite'}`}>{s}
              <button type="button" onClick={() => setList(list.filter((x) => x !== s))} aria-label={t('offer.remove', { skill: s })} className="grid h-7 w-7 place-items-center rounded-full hover:bg-black/10"><X size={14} aria-hidden="true" /></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NewOffer() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [must, setMust] = useState(['Kubernetes', 'Terraform']);
  const [nice, setNice] = useState(['Datadog']);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'job', work_mode: 'hybrid', min_experience_years: 5, match_threshold: 80, salary_min: 75000, salary_max: 90000 },
  });
  const th = watch('match_threshold');

  const submit = (status) => handleSubmit(async (v) => {
    setMsg(null); setBusy(status);
    try {
      if (!supabaseConfigured) { setMsg({ tone: 'info', text: t('offer.demoNote') }); return; }
      await api.post('/jobs', { ...v, required_skills: must, nice_to_have_skills: nice, status });
      nav('/app/recruiter');
    } catch (e) { setMsg({ tone: 'error', text: e.message }); } finally { setBusy(''); }
  });

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
      <PageHeader title={t('offer.new')} description={t('offer.desc')} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-5">
            <CardTitle>{t('offer.details')}</CardTitle>
            <div>
              <label htmlFor="o-title" className="label">{t('offer.jobTitle')}</label>
              <input id="o-title" className="input" placeholder="Lead DevOps & Cloud Engineer" aria-invalid={!!errors.title} aria-describedby={errors.title ? 'o-title-err' : undefined} {...register('title')} />
              {errors.title && <p id="o-title-err" className="mt-1 text-sm font-medium text-danger">{t('offer.errTitle')}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="o-type" className="label">{t('offer.contract')}</label>
                <select id="o-type" className="input" {...register('type')}><option value="job">{t('offer.contractJob')}</option><option value="internship">{t('offer.contractIntern')}</option></select></div>
              <div><label htmlFor="o-mode" className="label">{t('offer.remote')}</label>
                <select id="o-mode" className="input" {...register('work_mode')}>{['onsite', 'hybrid', 'remote'].map((k) => <option key={k} value={k}>{t(`offer.${k}`)}</option>)}</select></div>
              <div><label htmlFor="o-smin" className="label">{t('offer.salaryMin')}</label><input id="o-smin" type="number" min="0" inputMode="numeric" className="input" {...register('salary_min')} /></div>
              <div><label htmlFor="o-smax" className="label">{t('offer.salaryMax')}</label><input id="o-smax" type="number" min="0" inputMode="numeric" className="input" {...register('salary_max')} /></div>
            </div>
            <div><label htmlFor="o-miss" className="label">{t('offer.missions')}</label><textarea id="o-miss" rows={7} className="input" {...register('missions')} /></div>
          </Card>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="lg" loading={busy === 'draft'} onClick={submit('draft')}>{t('offer.save')}</Button>
            <Button type="button" size="lg" loading={busy === 'published'} onClick={submit('published')}>{t('offer.publish')}</Button>
            {msg && <Alert tone={msg.tone} className="flex-1">{msg.text}</Alert>}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="space-y-5 border-teal/30">
            <CardTitle>{t('offer.targeting')}</CardTitle>
            <div>
              <div className="flex items-center justify-between"><label htmlFor="o-th" className="label !mb-0">{t('offer.threshold')}</label><span className="text-lg font-bold tabular-nums text-teal-600">{th} %</span></div>
              <input id="o-th" type="range" min={50} max={95} step={5} className="mt-3 h-11 w-full accent-teal" aria-describedby="o-th-h" {...register('match_threshold')} />
              <p id="o-th-h" className="hint">{t('offer.thresholdHelp')}</p>
            </div>
            <div><label htmlFor="o-exp" className="label">{t('offer.minExp')}</label><input id="o-exp" type="number" min="0" inputMode="numeric" className="input" {...register('min_experience_years')} /></div>
            <SkillInput id="o-must" label={t('offer.must')} list={must} setList={setMust} tone="red" />
            <SkillInput id="o-nice" label={t('offer.nice')} list={nice} setList={setNice} tone="gray" />
          </Card>
          <Card>
            <CardTitle>{t('offer.howScore')}</CardTitle>
            <ul className="mt-3 space-y-3">
              {[['scoreSkills', 60], ['scoreExp', 25], ['scorePlace', 15]].map(([k, w]) => (
                <li key={k} className="text-sm"><div className="flex justify-between"><span>{t(`offer.${k}`)}</span><b className="tabular-nums">{w} %</b></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-alabaster-200"><div className="h-full rounded-full bg-teal" style={{ width: `${w * 1.6}%` }} /></div></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </form>
  );
}
