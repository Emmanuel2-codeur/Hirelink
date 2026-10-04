import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, Avatar, EmptyState, PageHeader, SkeletonCards } from '@/components/ui/kit';
import { IlluChat } from '@/components/illustrations';

export default function Messages() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [convs, setConvs] = useState(null);
  const [active, setActive] = useState(params.get('c'));
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const activeRef = useRef(active);
  const end = useRef(null);
  activeRef.current = active;

  const loadList = useCallback(() => api.get('/conversations').then(({ data }) => setConvs(data)).catch((e) => { setErr(e.message); setConvs([]); }), []);
  useEffect(() => { if (supabaseConfigured) loadList(); }, [loadList]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    if (!active) { setMsgs([]); return; }
    api.get(`/conversations/${active}/messages`)
      .then(({ data }) => { setMsgs(data); setConvs((l) => l?.map((c) => (c.id === active ? { ...c, unread: 0 } : c))); })
      .catch((e) => setErr(e.message));
  }, [active]);

  // Temps réel : tout nouveau message d'une de mes conversations (filtré par la RLS côté Supabase)
  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    const channel = supabase.channel(`chat-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (p) => {
        const m = p.new;
        if (m.conversation_id === activeRef.current) {
          setMsgs((l) => (l.some((x) => x.id === m.id) ? l : [...l, m]));
          if (m.sender_id !== user.id) await api.patch(`/conversations/${m.conversation_id}/read`).catch(() => {});
        }
        loadList();
      }).subscribe();
    // Filet de sécurité si le temps réel n'est pas activé : actualisation toutes les 20 s
    const poll = setInterval(() => {
      loadList();
      if (activeRef.current) api.get(`/conversations/${activeRef.current}/messages`).then(({ data }) => setMsgs((l) => (data.length !== l.length ? data : l))).catch(() => {});
    }, 20_000);
    return () => { clearInterval(poll); supabase.removeChannel(channel); };
  }, [user.id, loadList]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
  const select = (id) => { setActive(id); setParams(id ? { c: id } : {}); };

  async function send(e) {
    e.preventDefault();
    const body = text.trim(); if (!body || !active) return;
    setText(''); setErr('');
    try {
      const { data } = await api.post(`/conversations/${active}/messages`, { body });
      setMsgs((l) => (l.some((x) => x.id === data.id) ? l : [...l, data])); loadList();
    } catch (x) { setErr(x.message); setText(body); }
  }

  if (!supabaseConfigured) return <div className="space-y-6"><PageHeader title={t('messages.title')} /><Alert tone="info">{t('auth.demo')}</Alert></div>;
  const current = convs?.find((c) => c.id === active);
  const day = (d) => new Date(d).toLocaleDateString(i18n.language, { dateStyle: 'medium' });
  const time = (d) => new Date(d).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <PageHeader title={t('messages.title')} className={active ? 'max-md:sr-only' : ''} />
      <Alert tone="error">{err}</Alert>
      <div className="grid h-[calc(100dvh-14rem)] min-h-[26rem] gap-4 lg:h-[calc(100dvh-13rem)] md:grid-cols-[20rem_minmax(0,1fr)]">
        <div className={`${active ? 'hidden md:block' : ''} overflow-y-auto rounded-xl border border-line bg-white shadow-card`}>
          {convs === null && <div className="p-3"><SkeletonCards n={4} className="h-16" /></div>}
          {convs?.length === 0 && <EmptyState compact illustration={IlluChat} title={t('messages.noneTitle')} description={t('messages.noneDesc')} className="m-3 border-0" />}
          <ul>
            {convs?.map((c) => (
              <li key={c.id}><button onClick={() => select(c.id)} aria-current={c.id === active} className={`flex w-full items-start gap-3 border-b border-line/70 px-4 py-3 text-start hover:bg-alabaster ${c.id === active ? 'bg-teal-50' : ''}`}>
                <Avatar name={c.other_name || '?'} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{c.other_name || '—'}</span>
                    {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-teal px-1 text-xs font-bold text-white"><span className="sr-only">{c.unread} </span><span aria-hidden="true">{c.unread}</span></span>}</span>
                  <span className="block truncate text-xs text-muted">{c.job_title}</span>
                  {c.last_message && <span className={`mt-0.5 block truncate text-sm ${c.unread ? 'font-semibold text-ink' : 'text-muted'}`}>{c.last_message.mine ? `${t('messages.mine')} : ` : ''}{c.last_message.body}</span>}
                </span>
              </button></li>
            ))}
          </ul>
        </div>

        <div className={`${active ? 'flex' : 'hidden md:flex'} min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card`}>
          {!active ? <div className="m-auto"><EmptyState illustration={IlluChat} title={t('messages.select')} className="border-0" /></div> : (
            <>
              <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                <button className="grid h-11 w-11 place-items-center rounded-lg hover:bg-alabaster md:hidden" onClick={() => select(null)} aria-label={t('messages.back')}><ArrowLeft size={20} className="rtl-flip" /></button>
                <Avatar name={current?.other_name || '?'} />
                <div className="min-w-0"><div className="truncate font-semibold">{current?.other_name}</div><div className="truncate text-sm text-muted">{current?.job_title}</div></div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto bg-alabaster p-4" aria-live="polite">
                {msgs.length === 0 && <p className="py-8 text-center text-muted">{t('messages.empty')}</p>}
                {msgs.map((m, i) => {
                  const mine = m.sender_id === user.id;
                  const newDay = i === 0 || day(msgs[i - 1].created_at) !== day(m.created_at);
                  return (
                    <div key={m.id}>
                      {newDay && <div className="my-2 text-center text-xs font-medium text-muted">{day(m.created_at)}</div>}
                      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-base ${mine ? 'bg-teal text-white' : 'bg-white shadow-card'}`}>
                          {m.body}<div className={`mt-0.5 text-xs ${mine ? 'text-white' : 'text-muted'}`}>{time(m.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={end} />
              </div>
              <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
                <label htmlFor="msg-input" className="sr-only">{t('messages.placeholder')}</label>
                <input id="msg-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={t('messages.placeholder')} className="input flex-1" autoComplete="off" />
                <Button variant="accent" size="icon" aria-label={t('messages.send')} disabled={!text.trim()}><Send size={18} className="rtl-flip" /></Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
