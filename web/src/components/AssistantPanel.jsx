import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Sparkles, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

// Assistant IA (§11) : historique, saisie, envoi, effacement, fermeture, indicateur de génération.
// La langue envoyée est la langue courante de la plateforme (§13).
export default function AssistantPanel({ open, onClose, hasBottomNav }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState(() => { try { return JSON.parse(localStorage.getItem('hirelink.chat') || '[]'); } catch { return []; } });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const field = useRef(null);

  useEffect(() => { localStorage.setItem('hirelink.chat', JSON.stringify(messages)); end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    if (!open) return undefined;
    field.current?.focus();
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;

  async function send(e) {
    e.preventDefault();
    const text = input.trim(); if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next); setInput(''); setBusy(true);
    try {
      if (!supabaseConfigured) throw new Error('demo');
      const { data } = await api.post('/ai/chat', { messages: next, language: i18n.language });
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: err.message === 'demo' ? t('assistant.demo') : err.message, error: true }]);
    } finally { setBusy(false); }
  }

  return (
    <section role="dialog" aria-label={t('assistant.title')}
      className={`fixed inset-x-3 z-50 flex h-[min(34rem,calc(100dvh-8rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-pop sm:inset-x-auto sm:end-4 sm:w-96 ${hasBottomNav ? 'bottom-20 lg:bottom-4' : 'bottom-4'}`}>
      <header className="flex items-center justify-between bg-yale px-4 py-2 text-white">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white"><Sparkles size={18} className="text-mint" aria-hidden="true" />{t('assistant.title')}</h2>
        <span className="flex">
          <button aria-label={t('assistant.clear')} onClick={() => setMessages([])} className="grid h-11 w-11 place-items-center rounded-lg hover:bg-white/15"><Trash2 size={18} /></button>
          <button aria-label={t('assistant.close')} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-lg hover:bg-white/15"><X size={20} /></button>
        </span>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-alabaster p-4 text-sm" aria-live="polite">
        {messages.length === 0 && <p className="text-muted">{t('assistant.welcome')}</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-base ${m.role === 'user' ? 'bg-teal text-white' : m.error ? 'border border-danger/30 bg-danger-50 text-danger' : 'bg-white shadow-card'}`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="flex items-center gap-2 text-muted" role="status"><span className="flex gap-1" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: `${i * 120}ms` }} />)}</span>{t('assistant.thinking')}</div>}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <label className="sr-only" htmlFor="assistant-input">{t('assistant.placeholder')}</label>
        <input id="assistant-input" ref={field} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('assistant.placeholder')} className="input flex-1" />
        <Button variant="accent" size="icon" loading={busy} disabled={!input.trim()} aria-label={t('assistant.send')}>{!busy && <Send size={18} className="rtl-flip" />}</Button>
      </form>
    </section>
  );
}
