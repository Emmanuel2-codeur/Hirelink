import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { UserRound, Briefcase, ShieldCheck, ArrowRight, Lock, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Landing() {
  const { t } = useTranslation();
  const spaces = [
    { icon: UserRound, title: 'landing.candidateSpace', desc: 'landing.candidateDesc' },
    { icon: Briefcase, title: 'landing.recruiterSpace', desc: 'landing.recruiterDesc' },
    { icon: ShieldCheck, title: 'landing.adminSpace', desc: 'landing.adminDesc' },
  ];
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-alabaster-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2"><img src="/logo.png" alt="HireLink" className="h-10 w-10 object-contain" /><b className="text-yale">HireLink</b></div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button asChild variant="ghost"><Link to="/login">{t('nav.login')}</Link></Button>
          <Button asChild><Link to="/register">{t('nav.start')}</Link></Button>
        </div>
      </header>
      <section className="bg-gradient-to-b from-yale to-yale-700 px-6 py-20 text-center text-white">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">{t('landing.title')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-white/80">{t('landing.subtitle')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="accent" size="lg"><Link to="/register">{t('landing.candidateSpace')}</Link></Button>
            <Button asChild variant="outline" size="lg" className="text-graphite"><Link to="/register">{t('landing.recruiterSpace')}</Link></Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/80">
            <span className="flex items-center gap-2"><Scale size={16} /> {t('landing.neutral')}</span>
            <span className="flex items-center gap-2"><Lock size={16} /> {t('landing.gdpr')}</span>
          </div>
        </motion.div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-6 py-14 md:grid-cols-3">
        {spaces.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="flex flex-col gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal"><Icon size={20} /></span>
            <h3 className="font-semibold">{t(title)}</h3>
            <p className="flex-1 text-sm text-graphite/70">{t(desc)}</p>
            <Link to="/login" className="flex items-center gap-1 text-sm font-medium text-teal">{t(title)} <ArrowRight size={14} className="rtl-flip" /></Link>
          </Card>
        ))}
      </section>
      <footer className="border-t border-alabaster-200 py-6 text-center text-xs text-graphite/60">{t('brand.tagline')} · © 2026 HireLink</footer>
    </div>
  );
}
