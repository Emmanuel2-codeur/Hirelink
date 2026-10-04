import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Briefcase, Check, Languages, Scale, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/card';
import { ScoreRing } from '@/components/ui/kit';
import { IlluCalendar, IlluChat, IlluDocs, IlluMatch, IlluSearch, IlluShield, Ribbon } from '@/components/illustrations';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Arrow = () => <ArrowRight size={18} className="rtl-flip" aria-hidden="true" />;

export default function Landing() {
  const { t } = useTranslation();
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const steps = [
    { Illu: IlluSearch, title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { Illu: IlluMatch, title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { Illu: IlluCalendar, title: t('landing.step3Title'), desc: t('landing.step3Desc') },
  ];
  const audiences = [
    { Icon: UserRound, title: t('landing.forCandidates'), items: ['c1', 'c2', 'c3'], role: 'candidate', cta: t('landing.ctaCandidate') },
    { Icon: Briefcase, title: t('landing.forRecruiters'), items: ['r1', 'r2', 'r3'], role: 'recruiter', cta: t('landing.ctaRecruiter') },
  ];

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold text-yale focus:not-sr-only focus:fixed focus:start-4 focus:top-4">{t('ux.skip')}</a>

      {/* ---------- En-tête : transparent sur la photo, plein au défilement ---------- */}
      <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-200 ${solid ? 'border-b border-line bg-white/95 text-ink shadow-card backdrop-blur' : 'text-white'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="HireLink">
            <img src="/logo.png" alt="" width="40" height="40" className="h-10 w-10 rounded-lg bg-white object-contain p-0.5" />
            <span className="text-lg font-bold tracking-tight">HireLink</span>
          </Link>
          <nav className="ms-8 hidden items-center gap-1 md:flex" aria-label="Sections">
            {[['#how', 'nav.how'], ['#features', 'nav.features']].map(([href, k]) => (
              <a key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-medium ${solid ? 'hover:bg-alabaster' : 'hover:bg-white/10'}`}>{t(k)}</a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <Button asChild variant={solid ? 'ghost' : 'outlineOnDark'} size="sm" className="hidden sm:inline-flex"><Link to="/login">{t('nav.login')}</Link></Button>
            <Button asChild variant={solid ? 'default' : 'mint'} size="sm"><Link to="/register">{t('nav.start')}</Link></Button>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------- Hero : la photo EST le fond ---------- */}
        <section className="relative isolate overflow-hidden bg-yale-900 text-white">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <picture>
              <source srcSet="/hero.webp" type="image/webp" />
              <img src="/hero.jpg" alt="" width="735" height="490" fetchPriority="high"
                className="hero-fade absolute inset-y-0 end-0 h-full w-full object-cover object-[58%_28%] lg:w-[74%]" />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-yale-900 via-yale-900/60 to-yale-900/70 lg:hidden" />
            <div className="absolute inset-0 hidden bg-gradient-to-r from-yale-900 via-yale-900/75 to-yale-900/5 lg:block rtl:bg-gradient-to-l" />
            <Ribbon className="absolute inset-x-0 bottom-0 h-32 w-full" />
          </div>

          <div className="mx-auto flex min-h-[calc(100dvh-1rem)] max-w-7xl items-center px-4 pb-20 pt-28 md:px-8">
            <div className="max-w-2xl">
              <h1 className="rise text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">{t('landing.heroTitle')}</h1>
              <p className="rise mt-5 max-w-xl text-lg text-white/85" style={{ '--d': '90ms' }}>{t('landing.heroSub')}</p>
              <div className="rise mt-8 flex flex-wrap gap-3" style={{ '--d': '180ms' }}>
                <Button asChild variant="mint" size="lg"><Link to="/register?role=candidate">{t('landing.ctaCandidate')} <Arrow /></Link></Button>
                <Button asChild variant="outlineOnDark" size="lg"><Link to="/register?role=recruiter">{t('landing.ctaRecruiter')}</Link></Button>
              </div>
              <ul className="rise mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/85" style={{ '--d': '270ms' }}>
                {[[Languages, 'trust1'], [Scale, 'trust2'], [ShieldCheck, 'trust3']].map(([Icon, k]) => (
                  <li key={k} className="flex items-center gap-2"><Icon size={18} className="text-mint" aria-hidden="true" />{t(`landing.${k}`)}</li>
                ))}
              </ul>
            </div>

            {/* Aperçu produit : un score expliqué (exemple) */}
            <aside className="rise absolute bottom-16 end-8 hidden w-72 rounded-2xl bg-white p-4 text-ink shadow-pop xl:block" style={{ '--d': '420ms' }} aria-label={t('ux.example')}>
              <div className="flex items-center gap-3">
                <ScoreRing value={92} size={52} />
                <div className="min-w-0"><div className="font-semibold"><bdi>Amina B.</bdi></div><div className="text-sm text-muted">{t('landing.matchExample')} · {t('ux.example').toLowerCase()}</div></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['React', 'Node.js', 'Docker'].map((s) => <Badge key={s} tone="green" icon={Check}>{s}</Badge>)}
                <Badge tone="red">{t('landing.matchMissing')}</Badge>
              </div>
            </aside>
          </div>
        </section>

        {/* ---------- Comment ça marche : vraie séquence → étapes numérotées ---------- */}
        <section id="how" className="scroll-mt-16 bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t('landing.howTitle')}</h2>
              <p className="mt-2 text-lg text-muted">{t('landing.howSub')}</p>
            </div>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map(({ Illu, title, desc }, i) => (
                <li key={title} className="flex flex-col rounded-2xl border border-line bg-alabaster p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-yale text-sm font-bold text-white">{i + 1}</span>
                    <h3 className="text-lg font-semibold leading-snug">{title}</h3>
                  </div>
                  <p className="mt-3 text-muted">{desc}</p>
                  <div className="mt-auto flex justify-center pt-6"><Illu className="h-36 w-auto" /></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Deux publics ---------- */}
        <section className="bg-alabaster py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 md:px-8 lg:grid-cols-2">
            {audiences.map(({ Icon, title, items, role, cta }) => (
              <div key={role} className="flex flex-col rounded-2xl bg-white p-6 shadow-card md:p-8">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal"><Icon size={24} aria-hidden="true" /></span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight">{title}</h2>
                <ul className="mt-5 space-y-3">
                  {items.map((k) => <li key={k} className="flex items-start gap-3"><Check size={20} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" /><span>{t(`landing.${k}`)}</span></li>)}
                </ul>
                <Button asChild variant="default" className="mt-8 self-start"><Link to={`/register?role=${role}`}>{cta} <Arrow /></Link></Button>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Atouts : grille asymétrique ---------- */}
        <section id="features" className="scroll-mt-16 bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">{t('landing.featuresTitle')}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-6">
              <article className="rounded-2xl bg-yale p-6 text-white md:col-span-4 md:p-8">
                <h3 className="text-xl font-semibold text-white">{t('landing.f1Title')}</h3>
                <p className="mt-2 max-w-md text-white/80">{t('landing.f1Desc')}</p>
                <div className="mt-6 space-y-3" role="img" aria-label="60 / 25 / 15">
                  {[['skills', 60], ['experience', 25], ['place', 15]].map(([k, w]) => (
                    <div key={k} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 text-white/85">{t(`landing.${k}`)}</span>
                      <span className="h-3 flex-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-mint" style={{ width: `${w * 1.6}%` }} /></span>
                      <span className="w-10 text-end font-semibold tabular-nums">{w} %</span>
                    </div>
                  ))}
                </div>
              </article>
              <article className="flex flex-col rounded-2xl border border-line bg-alabaster p-6 md:col-span-2">
                <h3 className="text-lg font-semibold">{t('landing.f2Title')}</h3><p className="mt-1 text-muted">{t('landing.f2Desc')}</p>
                <div className="mt-auto flex justify-center pt-4"><IlluChat className="h-32 w-auto" /></div>
              </article>
              <article className="flex flex-col rounded-2xl border border-line bg-alabaster p-6 md:col-span-3">
                <h3 className="text-lg font-semibold">{t('landing.f3Title')}</h3><p className="mt-1 max-w-sm text-muted">{t('landing.f3Desc')}</p>
                <div className="mt-auto flex justify-end pt-4"><IlluDocs className="h-36 w-auto" /></div>
              </article>
              <article className="flex flex-col rounded-2xl border border-line bg-alabaster p-6 md:col-span-3">
                <h3 className="text-lg font-semibold">{t('landing.f4Title')}</h3><p className="mt-1 max-w-sm text-muted">{t('landing.f4Desc')}</p>
                <div className="mt-auto flex justify-end pt-4"><IlluShield className="h-36 w-auto" /></div>
              </article>
            </div>
          </div>
        </section>

        {/* ---------- Appel final ---------- */}
        <section className="bg-white px-4 pb-16 md:px-8 md:pb-24">
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl bg-yale-900 px-6 py-14 text-center text-white md:px-12 md:py-20">
            <Ribbon className="absolute inset-x-0 bottom-0 -z-10 h-40 w-full" />
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white md:text-4xl">{t('landing.ctaTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/80">{t('landing.ctaSub')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="mint" size="lg"><Link to="/register?role=candidate">{t('landing.ctaCandidate')}</Link></Button>
              <Button asChild variant="outlineOnDark" size="lg"><Link to="/register?role=recruiter">{t('landing.ctaRecruiter')}</Link></Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-alabaster">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-8">
          <div className="flex items-center gap-3"><img src="/logo.png" alt="" width="40" height="40" className="h-10 w-10 object-contain" /><div><div className="font-bold">HireLink</div><div className="text-sm text-muted">{t('brand.tagline')}</div></div></div>
          <nav className="flex flex-wrap items-center gap-x-5" aria-label="Footer">
            <Link to="/login" className="py-2 text-sm font-medium hover:underline">{t('nav.login')}</Link>
            <Link to="/register" className="py-2 text-sm font-medium hover:underline">{t('auth.register')}</Link>
            <LanguageSwitcher />
          </nav>
          <p className="w-full text-sm text-muted">© 2026 HireLink · {t('landing.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
