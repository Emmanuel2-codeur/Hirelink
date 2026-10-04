import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Briefcase, Building2, Eye, EyeOff, GraduationCap, ShieldCheck, Sparkles, MessagesSquare, Target } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/kit';
import { IlluMatch, Ribbon } from '@/components/illustrations';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const ROLES = [['candidate', GraduationCap], ['recruiter', Briefcase], ['company', Building2]];

export default function Login({ mode }) {
  const { t } = useTranslation();
  const { user, signIn, signUp, demo, demoLogin } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const register_ = mode === 'register';
  const initialRole = ROLES.some(([r]) => r === params.get('role')) ? params.get('role') : 'candidate';

  const schema = useMemo(() => z.object({
    email: z.string().email(t('auth.errEmail')),
    password: register_ ? z.string().min(8, t('auth.errPassword')) : z.string().min(1, t('auth.errRequired')),
    full_name: register_ ? z.string().trim().min(2, t('auth.errName')) : z.string().optional(),
    role: z.enum(['candidate', 'recruiter', 'company']),
  }), [t, register_]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { role: initialRole } });
  if (user) return <Navigate to="/app" replace />;

  const onSubmit = async (v) => {
    setError('');
    try { register_ ? await signUp(v) : await signIn(v.email, v.password); nav('/app'); }
    catch (e) { setError(e.message); }
  };
  const err = (id, m) => m && <p id={`${id}-err`} className="mt-1 text-sm font-medium text-danger">{m.message}</p>;
  const a11y = (id, e) => ({ 'aria-invalid': !!e, 'aria-describedby': e ? `${id}-err` : undefined });

  const side = [[Sparkles, 'auth.side1'], [Target, 'auth.side2'], [MessagesSquare, 'auth.side3']];
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Panneau de marque */}
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-yale-900 p-10 text-white lg:flex xl:p-14">
        <Ribbon className="absolute inset-x-0 bottom-0 -z-10 h-56 w-full" />
        <Link to="/" className="flex items-center gap-3" aria-label="HireLink">
          <img src="/logo.png" alt="" width="44" height="44" className="h-11 w-11 rounded-lg bg-white object-contain p-0.5" /><span className="text-xl font-bold">HireLink</span>
        </Link>
        <div>
          <div className="mx-auto mb-8 w-full max-w-sm rounded-2xl bg-white p-6 shadow-pop"><IlluMatch className="h-auto w-full" /></div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">{t('brand.tagline')}</h2>
          <ul className="mt-6 space-y-4">
            {side.map(([Icon, k]) => <li key={k} className="flex items-center gap-3 text-white/90"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10"><Icon size={20} className="text-mint" aria-hidden="true" /></span>{t(k)}</li>)}
          </ul>
        </div>
        <p className="text-sm text-white/70">© 2026 HireLink</p>
      </aside>

      {/* Formulaire */}
      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} className="rtl-flip" aria-hidden="true" />{t('auth.backHome')}</Link>
          <LanguageSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-3xl font-bold tracking-tight">{register_ ? t('auth.createTitle') : t('auth.welcome')}</h1>
          <p className="mt-2 text-muted">{register_ ? t('auth.createSub') : t('auth.welcomeSub')}</p>

          {demo && (
            <section className="mt-6 rounded-xl border border-teal/30 bg-teal-50 p-4" aria-labelledby="demo-t">
              <h2 id="demo-t" className="text-sm font-semibold text-teal-600">{t('auth.demoTitle')}</h2>
              <p className="mt-1 text-sm text-ink">{t('auth.demo')}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[['candidate', GraduationCap], ['recruiter', Briefcase], ['admin', ShieldCheck]].map(([r, Icon]) => (
                  <Button key={r} type="button" variant="outline" size="sm" onClick={() => { demoLogin(r); nav('/app'); }}><Icon size={16} aria-hidden="true" />{t(`auth.${r}`)}</Button>
                ))}
              </div>
            </section>
          )}

          {!demo && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
              {register_ && (
                <>
                  <fieldset>
                    <legend className="label">{t('auth.role')}</legend>
                    <div className="grid gap-2">
                      {ROLES.map(([r, Icon]) => (
                        <label key={r} className="relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-4 py-2 transition-colors has-[:checked]:border-teal has-[:checked]:bg-teal-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal/50">
                          <input type="radio" value={r} className="peer sr-only" {...register('role')} />
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-alabaster text-yale"><Icon size={18} aria-hidden="true" /></span>
                          <span className="min-w-0"><span className="block font-semibold">{t(`auth.${r}`)}</span><span className="block text-sm text-muted">{t(`auth.${r}Desc`)}</span></span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div>
                    <label htmlFor="full_name" className="label">{t('auth.fullName')}</label>
                    <input id="full_name" autoComplete="name" className="input" {...a11y('full_name', errors.full_name)} {...register('full_name')} />
                    {err('full_name', errors.full_name)}
                  </div>
                </>
              )}
              <div>
                <label htmlFor="email" className="label">{t('auth.email')}</label>
                <input id="email" type="email" inputMode="email" autoComplete="email" className="input" {...a11y('email', errors.email)} {...register('email')} />
                {err('email', errors.email)}
              </div>
              <div>
                <label htmlFor="password" className="label">{t('auth.password')}</label>
                <div className="relative">
                  <input id="password" type={show ? 'text' : 'password'} autoComplete={register_ ? 'new-password' : 'current-password'} className="input pe-12" {...a11y('password', errors.password)} {...register('password')} />
                  <button type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="absolute inset-y-0 end-0 grid w-11 place-items-center text-muted hover:text-ink">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {errors.password ? err('password', errors.password) : register_ && <p className="hint">{t('auth.passwordHint')}</p>}
              </div>
              <Alert tone="error">{error}</Alert>
              <Button size="lg" className="w-full" loading={isSubmitting}>{isSubmitting ? t('auth.submitting') : register_ ? t('auth.register') : t('auth.login')}</Button>
            </form>
          )}

          <p className="mt-6 text-center text-muted">
            {register_ ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
            <Link className="font-semibold text-teal-600 underline-offset-2 hover:underline" to={register_ ? '/login' : '/register'}>{register_ ? t('auth.login') : t('auth.register')}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
