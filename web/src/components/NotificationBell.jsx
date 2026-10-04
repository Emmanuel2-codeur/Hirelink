import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff } from 'lucide-react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function NotificationBell({ tone = 'light' }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => api.get('/notifications').then(({ data }) => setItems(data)).catch(() => {}), []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 60_000); // filet de sécurité si le temps réel n'est pas activé
    const channel = supabase.channel(`notif-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => { setItems((l) => [payload.new, ...l]); setToast(payload.new); setTimeout(() => setToast(null), 5000); })
      .subscribe();
    return () => { clearInterval(poll); supabase.removeChannel(channel); };
  }, [user.id, load]);

  const label = (n) => {
    const d = n.data || {};
    const date = d.scheduled_at ? new Date(d.scheduled_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }) : '';
    switch (n.type) {
      case 'application_status': return t('notif.application_status', { job: n.title, status: t(`status.${d.status || n.body}`) });
      case 'interview_scheduled': return t('notif.interview_scheduled', { job: n.title, date });
      case 'interview_cancelled': return t('notif.interview_cancelled', { job: n.title });
      case 'document_available': return t('notif.document_available', { title: n.title });
      case 'new_message': return t('notif.new_message', { job: n.title });
      case 'new_application': return t('notif.new_application', { job: n.title });
      default: return n.title || n.type;
    }
  };
  const target = (n) => (n.type === 'new_message' ? `/app/messages?c=${n.data?.conversation_id || ''}` : n.type === 'document_available' ? '/app/documents' : n.type.startsWith('interview') ? '/app/interviews' : n.type === 'new_application' ? '/app/recruiter' : '/app/candidate');
  const unread = items.filter((n) => !n.read).length;

  const click = async (n) => {
    setOpen(false);
    if (!n.read) { setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x))); api.patch(`/notifications/${n.id}/read`).catch(() => {}); }
    nav(target(n));
  };
  const markAll = async () => { setItems((l) => l.map((x) => ({ ...x, read: true }))); api.patch('/notifications/read-all').catch(() => {}); };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="true"
        aria-label={`${t('notif.title')}${unread ? ` (${unread})` : ''}`}
        className={`relative grid h-11 w-11 place-items-center rounded-lg ${tone === 'dark' ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-alabaster-200/60'}`}>
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && <span className="absolute end-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-xs font-bold leading-none text-white" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label={t('nav.close')} tabIndex={-1} />
          <div className="fixed inset-x-3 top-16 z-50 rounded-xl border border-line bg-white text-ink shadow-pop lg:absolute lg:inset-x-auto lg:start-0 lg:top-full lg:mt-2 lg:w-80">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
              <h2 className="text-sm font-semibold">{t('notif.title')}</h2>
              {unread > 0 && <button onClick={markAll} className="min-h-11 text-sm font-medium text-teal-600 underline">{t('notif.markAll')}</button>}
            </div>
            <div className="max-h-[60vh] overflow-y-auto lg:max-h-96">
              {items.length === 0 && <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted"><BellOff size={28} aria-hidden="true" />{t('notif.none')}</div>}
              {items.slice(0, 30).map((n) => (
                <button key={n.id} onClick={() => click(n)} className={`block w-full border-b border-line/70 px-4 py-3 text-start text-sm hover:bg-alabaster ${n.read ? 'text-muted' : 'font-medium text-ink'}`}>
                  {!n.read && <span className="me-2 inline-block h-2 w-2 rounded-full bg-teal" aria-hidden="true" />}{label(n)}
                  <span className="mt-0.5 block text-xs font-normal text-muted">{new Date(n.created_at).toLocaleString(i18n.language)}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {toast && <div role="status" className="fixed end-4 top-4 z-[60] max-w-xs rounded-xl bg-yale px-4 py-3 text-sm font-medium text-white shadow-pop">{label(toast)}</div>}
    </div>
  );
}
