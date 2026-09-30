import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function NotificationBell() {
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
    const channel = supabase.channel(`notif-${user.id}`)
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
      case 'new_application': return t('notif.new_application', { job: n.title });
      default: return n.title || n.type;
    }
  };
  const target = (n) => (n.type.startsWith('interview') ? '/app/interviews' : n.type === 'new_application' ? '/app/recruiter' : '/app/candidate');
  const unread = items.filter((n) => !n.read).length;

  const click = async (n) => {
    setOpen(false);
    if (!n.read) { setItems((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x))); api.patch(`/notifications/${n.id}/read`).catch(() => {}); }
    nav(target(n));
  };
  const markAll = async () => { setItems((l) => l.map((x) => ({ ...x, read: true }))); api.patch('/notifications/read-all').catch(() => {}); };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label={t('notif.title')} className="relative rounded-lg p-2 hover:bg-alabaster-200/60">
        <Bell size={20} />
        {unread > 0 && <span className="absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-alabaster-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-alabaster-200 px-4 py-2">
            <b className="text-sm">{t('notif.title')}</b>
            {unread > 0 && <button onClick={markAll} className="text-xs text-teal underline">{t('notif.markAll')}</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="p-4 text-sm text-graphite/60">{t('notif.none')}</p>}
            {items.slice(0, 30).map((n) => (
              <button key={n.id} onClick={() => click(n)} className={`block w-full border-b border-alabaster-200/70 px-4 py-3 text-start text-sm hover:bg-alabaster ${n.read ? 'text-graphite/60' : 'font-medium'}`}>
                {!n.read && <span className="me-2 inline-block h-2 w-2 rounded-full bg-teal" />}{label(n)}
                <div className="mt-0.5 text-[11px] font-normal text-graphite/50">{new Date(n.created_at).toLocaleString(i18n.language)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {toast && <div className="fixed end-4 top-4 z-[60] max-w-xs rounded-xl bg-yale px-4 py-3 text-sm text-white shadow-2xl">{label(toast)}</div>}
    </div>
  );
}
