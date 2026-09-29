import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { supabaseConfigured } from '@/lib/supabase';
import { FileText, CalendarClock, Target, Upload } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const radar = [['Python / ML', 92], ['Data Science', 80], ['Cloud (AWS)', 68], ['SQL / DB', 90], ['Deep Learning', 76], ['Architecture', 55]].map(([skill, value]) => ({ skill, value }));
const offers = [
  { id: 1, title: 'Lead Data Scientist', company: 'DataRobot FR', where: 'Paris (Hybride)', match: 94, tags: ['PyTorch', 'MLOps'] },
  { id: 2, title: 'Senior ML Engineer', company: 'Mistral AI', where: 'Paris / Remote', match: 89, tags: ['LLM', 'C++'] },
  { id: 3, title: 'Architecte Cloud Data', company: 'OVH Cloud', where: 'Lyon', match: 85, tags: ['Kubernetes', 'AWS'] },
];

export default function CandidateDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [apps, setApps] = useState(null);
  useEffect(() => { if (supabaseConfigured) api.get('/applications/mine').then(({ data }) => setApps(data)).catch(() => setApps([])); }, []);
  const active = apps ? apps.filter((a) => !['accepted', 'rejected'].includes(a.status)).length : 3;
  const interviews = apps ? apps.filter((a) => a.status === 'interview').length : 1;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-yale">{t('dash.hello', { name: user.name })} 👋</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label={t('dash.activeApps')} value={String(active)} />
        <StatCard icon={CalendarClock} label={t('dash.interviews')} value={String(interviews)} />
        <StatCard icon={Target} label={t('dash.medianMatch')} value="89.3%" />
      </div>
      {supabaseConfigured && (
        <Card className="space-y-2">
          <div className="flex items-center justify-between"><CardTitle>{t('flow.myApps')}</CardTitle><Button asChild size="sm" variant="outline"><Link to="/app/jobs">{t('nav.offers')}</Link></Button></div>
          {apps && apps.length === 0 && <p className="text-sm text-graphite/60">{t('flow.noApps')} <Link className="text-teal underline" to="/app/profile">{t('nav.profile')}</Link></p>}
          {(apps || []).map((a) => (
            <div key={a.id} className="flex items-center justify-between border-t border-alabaster-200 pt-2 text-sm">
              <span><b>{a.job_offers?.title}</b> <span className="text-graphite/60">· {a.job_offers?.companies?.name}</span></span>
              <Badge tone={a.status === 'rejected' ? 'red' : a.status === 'accepted' ? 'teal' : 'gray'}>{t(`status.${a.status}`)}</Badge>
            </div>
          ))}
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="flex flex-col items-center gap-2 border-dashed py-10 text-center">
            <Upload className="text-teal" />
            <p className="font-medium">{t('dash.uploadCv')}</p>
            <p className="text-xs text-graphite/60">PDF · DOCX</p>
            <Button variant="outline" size="sm">{t('common.soon')}</Button>
          </Card>
          <Card>
            <CardTitle className="mb-2">{t('dash.skills')} 360°</CardTitle>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer>
                <RadarChart data={radar}><PolarGrid /><PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#3C6E71" fill="#3C6E71" fillOpacity={0.35} /></RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div className="space-y-3">
          <CardTitle>{t('dash.recommended')}</CardTitle>
          {offers.map((o) => (
            <Card key={o.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div><div className="font-semibold">{o.title}</div><div className="text-xs text-graphite/60">{o.company} · {o.where}</div></div>
                <Badge>{o.match}% {t('dash.match')}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">{o.tags.map((g) => <Badge key={g} tone="gray">{g}</Badge>)}</div>
              <Button variant="accent" size="sm" className="w-full">{t('dash.apply')}</Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
