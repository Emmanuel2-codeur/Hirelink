import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Sparkles, Users, Briefcase, BarChart3, LifeBuoy, ShieldCheck, Bot, LogOut, Menu, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import AssistantPanel from './AssistantPanel';

const NAV = {
  candidate: [['/app/candidate', 'nav.dashboard', LayoutDashboard], ['/app/jobs', 'nav.offers', Briefcase], ['/app/profile', 'nav.profile', UserRound]],
  recruiter: [['/app/recruiter', 'nav.dashboard', LayoutDashboard], ['/app/offers/new', 'nav.offers', Briefcase], ['/app/recruiter', 'nav.matchAi', Sparkles]],
  admin: [['/app/admin', 'nav.admin', ShieldCheck], ['/app/recruiter', 'nav.dashboard', LayoutDashboard]],
};
NAV.company = NAV.recruiter;

export default function AppLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [chat, setChat] = useState(false);
  const [menu, setMenu] = useState(false);
  const items = NAV[user.role] || NAV.candidate;

  return (
    <div className="flex min-h-screen">
      <aside className={`${menu ? 'flex' : 'hidden'} fixed inset-y-0 z-40 w-64 flex-col bg-yale p-4 text-white lg:static lg:flex`}>
        <img src="/logo.png" alt="HireLink" className="mb-6 h-16 w-16 rounded-xl bg-white object-contain p-1" />
        <nav className="flex-1 space-y-1">
          {items.map(([to, key, Icon], i) => (
            <NavLink key={i} to={to} onClick={() => setMenu(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white/15 font-semibold' : 'text-white/80 hover:bg-white/10'}`}>
              <Icon size={18} /> {t(key)}
            </NavLink>
          ))}
          <button onClick={() => setChat(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10"><Bot size={18} /> {t('nav.assistant')}</button>
          <span className="flex items-center gap-3 px-3 py-2 text-sm text-white/40"><BarChart3 size={18} /> {t('nav.reports')}</span>
          <span className="flex items-center gap-3 px-3 py-2 text-sm text-white/40"><LifeBuoy size={18} /> {t('nav.support')}</span>
        </nav>
        <div className="border-t border-white/15 pt-3 text-sm">
          <div className="font-semibold">{user.name}</div>
          <div className="mb-2 text-xs capitalize text-white/60">{user.role}</div>
          <LanguageSwitcher className="text-white" />
          <button onClick={async () => { await signOut(); nav('/'); }} className="mt-2 flex items-center gap-2 text-white/80 hover:text-white"><LogOut size={16} className="rtl-flip" /> {t('nav.logout')}</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-alabaster-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setMenu(!menu)} aria-label="menu"><Menu /></button>
          <img src="/logo.png" alt="" className="h-8 w-8 object-contain" /><b>HireLink</b>
        </div>
        <div className="mx-auto max-w-6xl p-4 lg:p-8"><Outlet /></div>
      </main>
      <AssistantPanel open={chat} onClose={() => setChat(false)} />
    </div>
  );
}
