import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const esc = (x = '') => String(x).replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function downloadIcs(iv, title) {
  const start = new Date(iv.scheduled_at);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HireLink//FR', 'BEGIN:VEVENT', `UID:${iv.id}@hirelink`,
    `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 3600_000))}`,
    `SUMMARY:${esc(title)}`, `LOCATION:${esc(iv.location_or_link)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: 'entretien.ics' });
  a.click(); URL.revokeObjectURL(a.href);
}

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
    await api.patch(`/interviews/${iv.id}/status`, { status }); load();
  };
  const now = Date.now();
  const upcoming = (list || []).filter((i) => i.status === 'scheduled' && new Date(i.scheduled_at) >= now);
  const past = (list || []).filter((i) => !upcoming.includes(i)).reverse();

  const Row = ({ iv }) => {
    const who = recruiter ? iv.candidate_profiles?.profiles?.full_name : iv.job_offers?.companies?.name;
    const isLink = /^https?:\/\//i.test(iv.location_or_link || '');
    return (
      <Card className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><b>{iv.job_offers?.title}</b><div className="text-xs text-graphite/60">{t('interviews.with')} {who || '—'}</div></div>
          <Badge tone={iv.status === 'cancelled' ? 'red' : iv.status === 'done' ? 'gray' : 'teal'}>{t(`status.${iv.status}`)}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <b>{new Date(iv.scheduled_at).toLocaleString(i18n.language, { dateStyle: 'full', timeStyle: 'short' })}</b>
          <Badge tone="gray">{t(`interviews.${iv.type || 'video'}`)}</Badge>
        </div>
        {iv.location_or_link && (isLink
          ? <a href={iv.location_or_link} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm text-teal underline"><ExternalLink size={14} />{t('interviews.open')}</a>
          : <p className="text-sm">{iv.location_or_link}</p>)}
        {iv.notes && <p className="text-xs text-graphite/70">{iv.notes}</p>}
        <div className="flex flex-wrap gap-2">
          {iv.status === 'scheduled' && <Button size="sm" variant="outline" onClick={() => downloadIcs(iv, iv.job_offers?.title)}><CalendarPlus size={14} /> {t('interviews.addCal')}</Button>}
          {recruiter && iv.status === 'scheduled' && <>
            <Button size="sm" variant="accent" onClick={() => setStatus(iv, 'done')}>{t('interviews.markDone')}</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus(iv, 'cancelled')}>{t('interviews.cancel')}</Button></>}
        </div>
      </Card>
    );
  };

  if (!supabaseConfigured) return <p className="text-sm">{t('common.soon')} (Supabase)</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-yale">{t('interviews.title')}</h1>
      {err && <p className="text-sm text-red-600">⚠ {err}</p>}
      {list === null && <p>{t('common.loading')}</p>}
      {list && list.length === 0 && !err && <p className="text-sm text-graphite/60">{t('interviews.none')}</p>}
      {upcoming.length > 0 && <div className="space-y-3"><CardTitle>{t('interviews.upcoming')}</CardTitle>{upcoming.map((i) => <Row key={i.id} iv={i} />)}</div>}
      {past.length > 0 && <div className="space-y-3"><CardTitle>{t('interviews.past')}</CardTitle>{past.map((i) => <Row key={i.id} iv={i} />)}</div>}
    </div>
  );
}
