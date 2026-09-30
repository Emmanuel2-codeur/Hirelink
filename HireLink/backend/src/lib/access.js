import { supabaseAdmin } from './supabase.js';
import { HttpError } from './http.js';

// Le backend utilise la clé service_role (qui ignore la RLS) : les vérifications de propriété sont donc faites ici.
export async function assertJobAccess(user, jobId) {
  if (user.role === 'admin') return;
  const { data: job } = await supabaseAdmin.from('job_offers').select('company_id').eq('id', jobId).maybeSingle();
  if (!job) throw new HttpError(404, 'Offre introuvable');
  const { data: m } = await supabaseAdmin.from('company_members').select('user_id')
    .eq('company_id', job.company_id).eq('user_id', user.id).maybeSingle();
  if (!m) throw new HttpError(403, 'Accès refusé', 'FORBIDDEN');
}

export async function assertApplicationAccess(user, applicationId) {
  const { data: app } = await supabaseAdmin.from('applications').select('job_id, candidate_id').eq('id', applicationId).maybeSingle();
  if (!app) throw new HttpError(404, 'Candidature introuvable');
  await assertJobAccess(user, app.job_id);
  return app;
}
