import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Send, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

// Assistant IA intégré (§11) : conversation, historique, saisie, envoi, effacement, fermeture X, indicateur de génération.
// La langue envoyée à l'IA est la langue courante de la plateforme (§13).
export default function AssistantPanel({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('hirelink.chat') || '[]'));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => { localStorage.setItem('hirelink.chat', JSON.stringify(messages)); end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
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
      setMessages([...next, { role: 'assistant', content: err.message === 'demo' ? '🔧 Mode démo — connectez Supabase + une clé IA pour activer les réponses.' : `⚠ ${err.message}` }]);
    } finally { setBusy(false); }
  }

  return (
    <aside className="fixed bottom-4 end-4 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-alabaster-200 bg-white shadow-2xl">
      <header className="flex items-center justify-between bg-yale px-4 py-3 text-white">
        <span className="flex items-center gap-2 font-semibold"><Sparkles size={18} /> {t('assistant.title')}</span>
        <span className="flex items-center gap-1">
          <button aria-label={t('assistant.clear')} title={t('assistant.clear')} onClick={() => setMessages([])} className="rounded p-1 hover:bg-white/15"><Trash2 size={16} /></button>
          <button aria-label={t('assistant.close')} title={t('assistant.close')} onClick={onClose} className="rounded p-1 hover:bg-white/15"><X size={18} /></button>
        </span>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-alabaster p-4 text-sm">
        {messages.length === 0 && <p className="text-graphite/70">{t('assistant.welcome')}</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${m.role === 'user' ? 'bg-teal text-white' : 'bg-white shadow-sm'}`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="animate-pulse text-xs text-graphite/60">{t('assistant.thinking')}</div>}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-alabaster-200 p-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('assistant.placeholder')}
          className="flex-1 rounded-lg border border-alabaster-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
        <Button variant="accent" size="md" disabled={busy} aria-label={t('assistant.send')}><Send size={16} className="rtl-flip" /></Button>
      </form>
    </aside>
  );
}
