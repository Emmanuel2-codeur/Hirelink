import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().optional(),
  role: z.enum(['candidate', 'recruiter', 'company']).default('candidate'),
});

export default function Login({ mode }) {
  const { t } = useTranslation();
  const { user, signIn, signUp, demo, demoLogin } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'candidate' } });
  if (user) return <Navigate to="/app" replace />;

  const onSubmit = async (v) => {
    setError('');
    try { mode === 'login' ? await signIn(v.email, v.password) : await signUp(v); nav('/app'); }
    catch (e) { setError(e.message); }
  };
  const field = 'w-full rounded-lg border border-alabaster-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal';

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md space-y-5 p-8">
        <div className="flex items-center justify-between">
          <Link to="/"><img src="/logo.png" alt="HireLink" className="h-14 w-14 object-contain" /></Link>
          <LanguageSwitcher />
        </div>
        <h1 className="text-2xl font-bold text-yale">{mode === 'login' ? t('auth.login') : t('auth.register')}</h1>

        {demo && (
          <div className="space-y-2 rounded-lg bg-teal-50 p-3 text-sm">
            <p className="text-teal">{t('auth.demo')}</p>
            <div className="grid grid-cols-2 gap-2">
              {['candidate', 'recruiter', 'admin'].map((r) => <Button key={r} type="button" variant="accent" size="sm" onClick={() => { demoLogin(r); nav('/app'); }}>{t(`auth.${r}`)}</Button>)}
            </div>
          </div>
        )}

        {!demo && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {mode === 'register' && <>
              <input className={field} placeholder={t('auth.fullName')} {...register('full_name')} />
              <select className={field} {...register('role')}>
                {['candidate', 'recruiter', 'company'].map((r) => <option key={r} value={r}>{t(`auth.${r}`)}</option>)}
              </select>
            </>}
            <input className={field} type="email" placeholder={t('auth.email')} {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            <input className={field} type="password" placeholder={t('auth.password')} {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" disabled={isSubmitting}>{mode === 'login' ? t('auth.login') : t('auth.register')}</Button>
          </form>
        )}
        <p className="text-center text-sm text-graphite/70">
          {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <Link className="font-medium text-teal" to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? t('auth.register') : t('auth.login')}</Link>
        </p>
      </Card>
    </div>
  );
}
