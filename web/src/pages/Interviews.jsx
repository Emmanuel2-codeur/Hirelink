import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, ExternalLink, MapPin, Phone, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, EmptyState, PageHeader, SkeletonCards } from '@/components/ui/kit';
import { IlluCalendar } from '@/components/illustrations';

const esc = (x = '') => String(x).replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function downloadIcs(iv, title) {
  const start = new Date(iv.scheduled_at);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HireLink//FR', 'BEGIN:VEVENT', `UID:${iv.id}@hirelink`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 3600_000))}`, `SUMMARY:${esc(title)}`, `LOCATION:${esc(iv.location_or_link)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'entretien.ics' });
  a.click(); URL.revokeObjectURL(a.href);
}
const TYPE_ICON = { video: Video, onsite: MapPin, phone: Phone };

export default function Interviews() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const recruiter = user.role !== 'candidate';
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => api.get('/interviews').then(({ data }) => setList(data)).catch((e) => { setErr(e.message); setList([]); }), []);
  useEffect(() => { if (supabaseConfigured) load(); else setList([]); }, [load]);
  const setStatus = async (iv, status) => {
    if (status === 'cancelled' && !window.confirm(t('interviews.cancelConfirm'))) return;
    try { await api.patch(`/interviews/${iv.id}/status`, { status }); load(); } catch (e) { setErr(e.message); }
  };

  const now = Date.now();
  const upcoming = (list || []).filter((i) => i.status === 'scheduled' && new Date(i.scheduled_at) >= now);
  const past = (list || []).filter((i) => !upcoming.includes(i)).reverse();

  const Row = ({ iv }) => {
    const who = recruiter ? iv.candidate_profiles?.profiles?.full_name : iv.job_offers?.companies?.name;
    const isLink = /^https?:\/\//i.test(iv.location_or_link || '');
    const d = new Date(iv.scheduled_at); const Icon = TYPE_ICON[iv.type] || Video;
    return (
      <li><Card className="flex flex-wrap gap-4 p-4 md:p-5">
        <div className="grid h-16 w-16 shrink-0 place-items-center self-start rounded-xl bg-teal-50 py-2 text-center text-teal-600" aria-hidden="true">
          <span className="text-xs font-semibold uppercase">{d.toLocaleDateString(i18n.language, { month: 'short' })}</span>
          <span className="text-2xl font-bold leading-none tabular-nums">{d.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{iv.job_offers?.title}</h3>
            <Badge tone={iv.status === 'cancelled' ? 'red' : iv.status === 'done' ? 'gray' : 'teal'}>{t(`status.${iv.status}`)}</Badge></div>
          <p className="text-sm text-muted">{t('interviews.with')} {who || '—'}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-sm"><time dateTime={iv.scheduled_at} className="font-semibold">{d.toLocaleString(i18n.language, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</time>
            <span className="inline-flex items-center gap-1 text-muted"><Icon size={14} aria-hidden="true" />{t(`interviews.${iv.type || 'video'}`)}</span></p>
          {iv.location_or_link && (isLink
            ? <a href={iv.location_or_link} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-teal-600 underline"><ExternalLink size={14} aria-hidden="true" />{t('interviews.open')}</a>
            : <p className="text-sm">{iv.location_or_link}</p>)}
          {iv.notes && <p className="text-sm text-muted">{iv.notes}</p>}
        </div>
        {iv.status === 'scheduled' && (
          <div className="flex flex-wrap items-start gap-2">
            <Button size="sm" variant="outline" onClick={() => downloadIcs(iv, iv.job_offers?.title)}><CalendarPlus size={16} aria-hidden="true" />{t('interviews.addCal')}</Button>
            {recruiter && <><Button size="sm" variant="accent" onClick={() => setStatus(iv, 'done')}>{t('interviews.markDone')}</Button><Button size="sm" variant="ghost" onClick={() => setStatus(iv, 'cancelled')}>{t('interviews.cancel')}</Button></>}
          </div>)}
      </Card></li>
    );
  };

  if (!supabaseConfigured) return <div className="space-y-6"><PageHeader title={t('interviews.title')} description={t('interviews.desc')} /><Alert tone="info">{t('auth.demo')}</Alert></div>;
  return (
    <div className="space-y-6">
      <PageHeader title={t('interviews.title')} description={t('interviews.desc')} />
      <Alert tone="error">{err}</Alert>
      {list === null && <SkeletonCards n={3} />}
      {list?.length === 0 && !err && <EmptyState illustration={IlluCalendar} title={t('interviews.noneTitle')} description={recruiter ? t('interviews.noneDescRec') : t('interviews.noneDescCand')} />}
      {upcoming.length > 0 && <section className="space-y-3" aria-labelledby="up-t"><CardTitle id="up-t">{t('interviews.upcoming')}</CardTitle><ul className="space-y-3">{upcoming.map((i) => <Row key={i.id} iv={i} />)}</ul></section>}
      {past.length > 0 && <section className="space-y-3" aria-labelledby="past-t"><CardTitle id="past-t">{t('interviews.past')}</CardTitle><ul className="space-y-3">{past.map((i) => <Row key={i.id} iv={i} />)}</ul></section>}
    </div>
  );
}
