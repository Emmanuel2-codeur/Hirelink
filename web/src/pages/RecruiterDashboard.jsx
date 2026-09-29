import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, Clock, TrendingUp, Plus } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Badge, Card, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabaseConfigured } from '@/lib/supabase';
import RecruiterLive from './RecruiterLive';

const src = [{ name: 'Directes', value: 52 }, { name: 'Sourcing IA', value: 22 }, { name: 'Cooptation', value: 12 }];
const COLORS = ['#3C6E71', '#284B63', '#9bbcbd'];
const ranking = [
  { name: 'Thomas Leroy', role: 'Lead Tech Full-Stack · 7 ans', match: 96, stack: ['React', 'Node.js', 'PostgreSQL'], status: 'Entretien RH prévu' },
  { name: 'Amina Benali', role: 'Ingénieure Fullstack & DevOps · 6 ans', match: 92, stack: ['Vue', 'Django', 'Docker'], status: 'En revue' },
  { name: 'Julien Moreau', role: 'Senior Frontend & Node · 6 ans', match: 88, stack: ['React', 'GraphQL'], status: 'Nouveau' },
];

function RecruiterDemo() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-yale">Dashboard & Match IA</h1><Badge>Senior Full-Stack Engineer (React / Python)</Badge></div>
        <Button asChild><Link to="/app/offers/new"><Plus size={16} /> {t('offer.new')}</Link></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label={t('dash.totalApps')} value="142" hint="+14%" />
        <StatCard icon={TrendingUp} label="Match IA" value="89.4%" hint="18 > 85%" />
        <StatCard icon={Clock} label={t('dash.avgHire')} value={t('dash.days', { n: 12 })} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardTitle>Provenance des talents</CardTitle>
          <div className="h-48" dir="ltr"><ResponsiveContainer><PieChart><Pie data={src} dataKey="value" innerRadius={45} outerRadius={70}>{src.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie></PieChart></ResponsiveContainer></div>
          <ul className="space-y-1 text-sm">{src.map((s, i) => <li key={s.name} className="flex justify-between"><span><i className="me-2 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />{s.name}</span><b>{s.value}%</b></li>)}</ul>
        </Card>
        <div className="space-y-3 lg:col-span-2">
          <CardTitle>{t('dash.ranking')}</CardTitle>
          {ranking.map((c) => (
            <Card key={c.name} className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2"><b>{c.name}</b><Badge>{c.match}% {t('dash.match')}</Badge><Badge tone="gray">{c.status}</Badge></div>
                <div className="text-xs text-graphite/60">{c.role}</div>
                <div className="flex gap-1">{c.stack.map((s) => <Badge key={s} tone="gray">{s}</Badge>)}</div>
              </div>
              <div className="flex gap-2"><Button variant="outline" size="sm">{t('dash.viewCv')}</Button><Button size="sm">{t('dash.planInterview')}</Button></div>
            </Card>
          ))}
          <p className="text-xs text-graphite/60">{t('landing.neutral')}</p>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterDashboard() { return supabaseConfigured ? <RecruiterLive /> : <RecruiterDemo />; }
