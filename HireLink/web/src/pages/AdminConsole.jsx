import { useTranslation } from 'react-i18next';
import { Users, FileText, Target, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Badge, Card, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabaseConfigured } from '@/lib/supabase';
import AdminLive from './AdminLive';

const companies = [
  { name: 'NovaTech Solutions SAS', siret: '893 204 112 00029', status: 'Vérifié', tone: 'teal' },
  { name: 'Banque Privée Albatros', siret: '412 889 014 00018', status: 'En attente', tone: 'amber' },
  { name: 'TalentPulse Consulting', siret: 'SIRET non concordant', status: 'Alerte OCR', tone: 'red' },
];

function AdminDemo() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-yale">{t('admin.title')}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label={t('admin.users')} value="12 830" hint="+8.4%" />
        <StatCard icon={FileText} label={t('admin.cvs')} value="45 890" hint="+18.4%" />
        <StatCard icon={Target} label={t('admin.score')} value="84.2%" />
        <StatCard icon={AlertTriangle} label={t('admin.alerts')} value="10" hint="7 + 3" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-3 lg:col-span-2">
          <CardTitle>{t('admin.companies')}</CardTitle>
          {companies.map((c) => (
            <div key={c.name} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-alabaster-200 p-3">
              <div><div className="flex items-center gap-2 font-medium">{c.name}<Badge tone={c.tone}>{c.status}</Badge></div><div className="text-xs text-graphite/60">SIRET : {c.siret}</div></div>
              <div className="flex gap-2"><Button variant="outline" size="sm">{t('admin.examine')}</Button><Button size="sm">{t('admin.validate')}</Button></div>
            </div>
          ))}
        </Card>
        <div className="space-y-4">
          <Card><CardTitle>{t('admin.quota')}</CardTitle><div className="mt-2 text-4xl font-bold text-teal">64.8%</div><div className="text-xs text-graphite/60">64.8M / 100M tokens</div>
            <div className="mt-3 h-2 rounded-full bg-alabaster-200"><div className="h-2 w-[64.8%] rounded-full bg-teal" /></div></Card>
          <Card className="space-y-2"><CardTitle className="flex items-center gap-2"><ShieldAlert size={16} className="text-red-600" />{t('admin.security')}</CardTitle>
            <p className="text-sm">Injection SQL <Badge tone="red">High</Badge></p><p className="text-sm">Bot suspect <Badge tone="amber">Medium</Badge></p></Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminConsole() { return supabaseConfigured ? <AdminLive /> : <AdminDemo />; }
