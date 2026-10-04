import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, FileText, Printer, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, EmptyState, PageHeader, SkeletonCards } from '@/components/ui/kit';
import { IlluDocs } from '@/components/illustrations';

const KINDS = ['work_contract', 'internship_agreement', 'attestation'];

// Aperçu : iframe « sandbox » sans scripts → même si un contenu malveillant passait, rien ne s'exécute.
function Preview({ doc, onClose }) {
  const { t } = useTranslation();
  const [html, setHtml] = useState(null);
  const [err, setErr] = useState('');
  const ref = useRef(null);
  useEffect(() => { api.get(`/documents/${doc.id}/html`).then(({ data }) => setHtml(data.html)).catch((e) => setErr(e.message)); }, [doc.id]);
  useEffect(() => { const esc = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, [onClose]);
  const print = () => { ref.current?.contentWindow?.focus(); ref.current?.contentWindow?.print(); };
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={doc.title}>
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 rounded-t-xl bg-white px-4 py-2">
        <h2 className="min-w-0 truncate text-base font-semibold">{doc.title}</h2>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="accent" onClick={print} disabled={!html}><Printer size={16} aria-hidden="true" /><span className="max-sm:sr-only">{t('documents.print')}</span></Button>
          <button onClick={onClose} aria-label={t('documents.close')} className="grid h-11 w-11 place-items-center rounded-lg hover:bg-alabaster"><X size={20} /></button>
        </div>
      </div>
      <p className="mx-auto w-full max-w-4xl bg-teal-50 px-4 py-2 text-sm text-teal-600">{t('documents.hint')}</p>
      {err && <div className="mx-auto w-full max-w-4xl bg-white p-4"><Alert tone="error">{err}</Alert></div>}
      {html && <iframe ref={ref} title={doc.title} sandbox="allow-same-origin allow-modals" srcDoc={html} className="mx-auto w-full max-w-4xl flex-1 rounded-b-xl bg-white" />}
    </div>
  );
}

function Generator({ onCreated }) {
  const { t, i18n } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [f, setF] = useState({ job: '', application: '', kind: 'work_contract', language: i18n.language, start_date: '', end_date: '', salary: '', workplace: '', mission: '', signatory_name: '', signatory_title: '', notes: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { api.get('/jobs/mine').then(({ data }) => setJobs(data)).catch(() => {}); }, []);
  useEffect(() => {
    setApps([]); setF((x) => ({ ...x, application: '' }));
    if (f.job) api.get(`/applications/job/${f.job}`).then(({ data }) => setApps(data)).catch(() => {});
  }, [f.job]);

  async function submit(e) {
    e.preventDefault(); setMsg(null); setBusy(true);
    const { job, application, kind, language, ...fields } = f;
    Object.keys(fields).forEach((k) => !fields[k] && delete fields[k]);
    try { const { data } = await api.post('/documents/generate', { application_id: application, kind, language, fields }); setMsg({ tone: 'success', text: t('documents.created') }); onCreated(data); }
    catch (x) { setMsg({ tone: 'error', text: x.message }); } finally { setBusy(false); }
  }
  const Field = ({ id, label, children }) => <div><label htmlFor={id} className="label">{label}</label>{children}</div>;
  return (
    <Card className="lg:col-span-3">
      <form onSubmit={submit} className="space-y-5">
        <CardTitle>{t('documents.generate')}</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="d-job" label={t('documents.job')}><select id="d-job" required className="input" value={f.job} onChange={set('job')}><option value="">{t('documents.selectJob')}</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></Field>
          <Field id="d-app" label={t('documents.applicant')}><select id="d-app" required className="input" value={f.application} onChange={set('application')} disabled={!f.job}>
            <option value="">{f.job && apps.length === 0 ? t('documents.noApplicants') : t('documents.selectApplicant')}</option>
            {apps.map((a) => <option key={a.id} value={a.id}>{a.candidate_profiles?.profiles?.full_name || a.id.slice(0, 8)} — {t(`status.${a.status}`)}</option>)}</select></Field>
          <Field id="d-kind" label={t('documents.kind')}><select id="d-kind" className="input" value={f.kind} onChange={set('kind')}>{KINDS.map((k) => <option key={k} value={k}>{t(`documents.kinds.${k}`)}</option>)}</select></Field>
          <Field id="d-lang" label={t('documents.language')}><select id="d-lang" className="input" value={f.language} onChange={set('language')}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></Field>
          <Field id="d-start" label={t('documents.startDate')}><input id="d-start" type="date" className="input" value={f.start_date} onChange={set('start_date')} /></Field>
          {f.kind !== 'work_contract' && <Field id="d-end" label={t('documents.endDate')}><input id="d-end" type="date" className="input" value={f.end_date} onChange={set('end_date')} /></Field>}
          <Field id="d-sal" label={t('documents.salary')}><input id="d-sal" className="input" value={f.salary} onChange={set('salary')} /></Field>
          <Field id="d-place" label={t('documents.workplace')}><input id="d-place" className="input" value={f.workplace} onChange={set('workplace')} /></Field>
          <Field id="d-sig" label={t('documents.signatory')}><input id="d-sig" className="input" value={f.signatory_name} onChange={set('signatory_name')} autoComplete="name" /></Field>
          <Field id="d-sigt" label={t('documents.signatoryTitle')}><input id="d-sigt" className="input" value={f.signatory_title} onChange={set('signatory_title')} /></Field>
        </div>
        {f.kind === 'internship_agreement' && <Field id="d-mis" label={t('documents.mission')}><textarea id="d-mis" rows={3} className="input" value={f.mission} onChange={set('mission')} /></Field>}
        <Field id="d-notes" label={t('documents.notes')}><textarea id="d-notes" rows={3} className="input" value={f.notes} onChange={set('notes')} /></Field>
        <div className="flex flex-wrap items-center gap-3"><Button variant="accent" size="lg" loading={busy}>{t('documents.create')}</Button>{msg && <Alert tone={msg.tone} className="flex-1">{msg.text}</Alert>}</div>
        <p className="text-sm text-muted">{t('documents.disclaimer')}</p>
      </form>
    </Card>
  );
}

export default function Documents() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const recruiter = user.role !== 'candidate';
  const [list, setList] = useState(null);
  const [view, setView] = useState(null);
  const load = useCallback(() => api.get('/documents').then(({ data }) => setList(data)).catch(() => setList([])), []);
  useEffect(() => { if (supabaseConfigured) load(); else setList([]); }, [load]);
  const remove = async (d) => { if (window.confirm(t('documents.deleteConfirm'))) { await api.delete(`/documents/${d.id}`); load(); } };

  if (!supabaseConfigured) return <div className="space-y-6"><PageHeader title={t('documents.title')} description={t('documents.desc')} /><Alert tone="info">{t('auth.demo')}</Alert></div>;
  return (
    <div className="space-y-6">
      <PageHeader title={t('documents.title')} description={t('documents.desc')} />
      <div className={recruiter ? 'grid items-start gap-6 lg:grid-cols-5' : ''}>
        {recruiter && <Generator onCreated={(d) => { load(); setView(d); }} />}
        <section className="space-y-3 lg:col-span-2" aria-labelledby="docs-t">
          <CardTitle id="docs-t">{t('documents.mine')}</CardTitle>
          {list === null && <SkeletonCards n={3} className="h-20" />}
          {list?.length === 0 && <EmptyState illustration={IlluDocs} title={t('documents.noneTitle')} description={recruiter ? t('documents.noneDescRec') : t('documents.noneDescCand')} />}
          <ul className={`space-y-3 ${!recruiter ? 'grid gap-3 space-y-0 md:grid-cols-2' : ''}`}>
            {list?.map((d) => (
              <li key={d.id}><Card className="flex flex-wrap items-center gap-3 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-600"><FileText size={20} aria-hidden="true" /></span>
                <div className="min-w-40 flex-1"><div className="flex flex-wrap items-center gap-2 font-semibold">{t(`documents.kinds.${d.kind}`, d.kind)} <Badge tone="gray">{d.language.toUpperCase()}</Badge></div>
                  <div className="break-words text-sm text-muted">{d.title} · {new Date(d.created_at).toLocaleDateString(i18n.language)}</div></div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setView(d)}><Eye size={16} aria-hidden="true" />{t('documents.view')}</Button>
                  {d.owner_id === user.id && <Button size="icon" variant="ghost" onClick={() => remove(d)} aria-label={`${t('documents.delete')} — ${d.title}`}><Trash2 size={18} /></Button>}
                </div>
              </Card></li>
            ))}
          </ul>
        </section>
      </div>
      {view && <Preview doc={view} onClose={() => setView(null)} />}
    </div>
  );
}
