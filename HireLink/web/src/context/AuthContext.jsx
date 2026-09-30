import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import i18n from '@/i18n';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { api } from '@/lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
const DEMO_KEY = 'hirelink.demo';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, email, name, role }
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (session) => {
    if (!session) { setUser(null); return; }
    const meta = session.user.user_metadata || {};
    let role = meta.role || 'candidate', name = meta.full_name || session.user.email;
    try { const { data } = await api.get('/users/me'); role = data.role; name = data.profile?.full_name || name; if (data.language) i18n.changeLanguage(data.language); } catch { /* API hors ligne */ }
    setUser({ id: session.user.id, email: session.user.email, name, role });
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      const d = localStorage.getItem(DEMO_KEY);
      if (d) setUser(JSON.parse(d));
      setLoading(false); return;
    }
    supabase.auth.getSession().then(({ data }) => load(data.session).finally(() => setLoading(false)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => load(s));
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const value = {
    user, loading, demo: !supabaseConfigured,
    async signIn(email, password) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; },
    async signUp({ email, password, full_name, role }) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name, role, language: i18n.language } } });
      if (error) throw error;
    },
    demoLogin(role) {
      const u = { id: `demo-${role}`, email: `${role}@demo.hirelink`, name: { candidate: 'Alexandre Mercier', recruiter: 'Clémence V.', company: 'Clémence V.', admin: 'Alexandre Dumas' }[role], role };
      localStorage.setItem(DEMO_KEY, JSON.stringify(u)); setUser(u);
    },
    async signOut() { localStorage.removeItem(DEMO_KEY); if (supabase) await supabase.auth.signOut(); setUser(null); },
    // Langue : appliquée à l'UI + persistée sur le profil (la langue de l'IA suit automatiquement)
    async setLanguage(lng) {
      await i18n.changeLanguage(lng);
      if (supabaseConfigured && user) api.patch('/users/me', { language: lng }).catch(() => {});
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
