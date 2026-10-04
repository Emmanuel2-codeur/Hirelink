import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Briefcase, CalendarClock, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, ShieldCheck, Sparkles, UserRound, X, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabaseConfigured } from '@/lib/supabase';
import { Avatar } from '@/components/ui/kit';
import { useMedia } from '@/lib/useMedia';
import LanguageSwitcher from './LanguageSwitcher';
import AssistantPanel from './AssistantPanel';
import NotificationBell from './NotificationBell';

const NAV = {
  candidate: [['/app/candidate', 'nav.dashboard', LayoutDashboard, 'nav.home'], ['/app/jobs', 'nav.offers', Briefcase], ['/app/messages', 'nav.messages', MessageSquare],
    ['/app/interviews', 'nav.interviews', CalendarClock], ['/app/documents', 'nav.documents', FileText, 'nav.shortDocs'], ['/app/profile', 'nav.profile', UserRound]],
  recruiter: [['/app/recruiter', 'nav.dashboard', LayoutDashboard, 'nav.home'], ['/app/offers/new', 'nav.newOffer', Briefcase, 'nav.shortOffer'], ['/app/messages', 'nav.messages', MessageSquare],
    ['/app/interviews', 'nav.interviews', CalendarClock], ['/app/documents', 'nav.documents', FileText, 'nav.shortDocs']],
  admin: [['/app/admin', 'nav.admin', ShieldCheck]],
};
NAV.company = NAV.recruiter;

const Logo = () => (
  <span className="flex items-center gap-2.5">
    <img src="/logo.png" alt="" width="40" height="40" className="h-10 w-10 rounded-lg bg-white object-contain p-0.5" />
    <span className="text-lg font-bold tracking-tight text-white">HireLink</span>
  </span>
);

// Contenu partagé : barre latérale (bureau) et tiroir (mobile)
function SidebarBody({ items, onNavigate, onAssistant, showBell }) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-1">
        <Logo />
        {showBell && supabaseConfigured && <NotificationBell tone="dark" />}
      </div>
      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto" aria-label="Navigation principale">
        {items.map(([to, key, Icon]) => (
          <NavLink key={to} to={to} onClick={onNavigate}
            className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg border-s-[3px] px-3 text-sm font-medium transition-colors ${isActive ? 'border-mint bg-white/10 text-white' : 'border-transparent text-white/80 hover:bg-white/5 hover:text-white'}`}>
            <Icon size={20} aria-hidden="true" />{t(key)}
          </NavLink>
        ))}
      </nav>
      <button onClick={onAssistant} className="mt-4 flex w-full items-center gap-3 rounded-xl bg-white/10 p-3 text-start transition-colors hover:bg-white/15">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mint text-yale-900"><Sparkles size={20} aria-hidden="true" /></span>
        <span className="min-w-0"><span className="block text-sm font-semibold text-white">{t('nav.assistant')}</span><span className="block text-xs text-white/75">{t('nav.assistantHint')}</span></span>
      </button>
      <div className="mt-4 border-t border-white/15 pt-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} className="bg-white/15 text-white" />
          <div className="min-w-0"><div className="truncate text-sm font-semibold text-white">{user.name}</div><div className="text-xs text-white/75">{t(`auth.${user.role}`)}</div></div>
        </div>
        <div className="mt-2 space-y-0.5">
          <LanguageSwitcher className="text-white/90" />
          <button onClick={async () => { await signOut(); nav('/'); }} className="flex min-h-11 w-full items-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium text-white/85 hover:text-white">
            <LogOut size={16} className="rtl-flip" aria-hidden="true" />{t('nav.logout')}
          </button>
        </div>
      </div>
    </>
  );
}

export default function AppLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const desktop = useMedia('(min-width: 1024px)'); // une seule mise en page montée à la fois (une seule cloche, un seul abonnement temps réel)
  const [chat, setChat] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const items = NAV[user.role] || NAV.candidate;
  const bottom = items.length <= 5 ? items : items.slice(0, 4);
  const hasBottom = items.length > 1;

  useEffect(() => { setDrawer(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    const esc = (e) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [drawer]);

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-white px-4 py-2 font-semibold text-yale focus:not-sr-only focus:fixed focus:start-4 focus:top-4">{t('ux.skip')}</a>

      {/* Barre latérale (bureau) */}
      {desktop && (
        <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col bg-yale-900 p-4">
          <SidebarBody items={items} showBell onAssistant={() => setChat(true)} />
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre du haut (mobile) */}
        {!desktop && <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 bg-yale-900 px-3">
          <Logo />
          <div className="flex items-center">
            <button onClick={() => setChat(true)} aria-label={t('nav.assistant')} className="grid h-11 w-11 place-items-center rounded-lg text-white hover:bg-white/10"><Sparkles size={20} /></button>
            {supabaseConfigured && <NotificationBell tone="dark" />}
          </div>
        </header>}

        <main id="main" className={`mx-auto w-full max-w-7xl flex-1 p-4 md:p-6 lg:p-8 ${hasBottom ? 'pb-24 lg:pb-8' : ''}`}><Outlet /></main>
      </div>

      {/* Navigation du bas (mobile) : 5 entrées maximum */}
      {hasBottom && !desktop && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-white pb-[env(safe-area-inset-bottom)]" style={{ gridTemplateColumns: `repeat(${bottom.length + (items.length > 5 ? 1 : 0)}, minmax(0, 1fr))` }} aria-label="Navigation principale">
          {bottom.map(([to, key, Icon, short]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${isActive ? 'text-teal-600' : 'text-muted'}`}>
              {({ isActive }) => (<><Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" /><span className="max-w-full truncate px-1">{t(short || key)}</span></>)}
            </NavLink>
          ))}
          {items.length > 5 && (
            <button onClick={() => setDrawer(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted" aria-haspopup="dialog">
              <MoreHorizontal size={22} aria-hidden="true" /><span>{t('nav.more')}</span>
            </button>
          )}
        </nav>
      )}

      {/* Tiroir mobile */}
      {drawer && !desktop && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
          <button className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} aria-label={t('nav.close')} tabIndex={-1} />
          <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-yale-900 p-4 shadow-pop">
            <button onClick={() => setDrawer(false)} aria-label={t('nav.close')} className="absolute end-2 top-2 grid h-11 w-11 place-items-center rounded-lg text-white hover:bg-white/10"><X size={20} /></button>
            <SidebarBody items={items} onNavigate={() => setDrawer(false)} showBell={false} onAssistant={() => { setDrawer(false); setChat(true); }} />
          </div>
        </div>
      )}

      <AssistantPanel open={chat} onClose={() => setChat(false)} hasBottomNav={hasBottom} />
    </div>
  );
}
