import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../services/theme';
import { getLang, setLang, t } from '../services/i18n';
import { get } from '../services/api';

export default function Home() {
  const [lng, setL] = useState('fr');
  const [jobs, setJobs] = useState([]);
  useEffect(() => { getLang().then(setL); get('/jobs').then((r) => setJobs(r.data || [])).catch(() => {}); }, []);
  const change = async (l) => { setL(l); await setLang(l); };
  return (
    <ScrollView style={{ backgroundColor: colors.alabaster }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: colors.yale }}>{t(lng, 'welcome')}</Text>
      <Text style={{ color: colors.graphite }}>{t(lng, 'tagline')}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['fr', 'en', 'ar'].map((l) => (
          <Pressable key={l} onPress={() => change(l)} style={{ padding: 10, borderRadius: 8, backgroundColor: lng === l ? colors.teal : '#fff', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: lng === l ? '#fff' : colors.graphite }}>{l.toUpperCase()}</Text></Pressable>))}
      </View>
      {jobs.map((j) => (
        <View key={j.id} style={{ backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontWeight: '600' }}>{j.title}</Text><Text style={{ color: '#666' }}>{j.location}</Text></View>))}
    </ScrollView>
  );
}
