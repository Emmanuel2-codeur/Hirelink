import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, ok } from '../lib/http.js';
import { assertJobAccess, assertApplicationAccess } from '../lib/access.js';
import { computeMatch } from '../services/matching.service.js';

export const apply = async (req, res) => {
  const { job_id, cv_url, cover_letter } = req.body;
  const [{ data: job }, { data: cand }] = await Promise.all([
    supabaseAdmin.from('job_offers').select('*').eq('id', job_id).eq('status', 'published').single(),
    supabaseAdmin.from('candidate_profiles').select('*').eq('user_id', req.user.id).single(),
  ]);
  if (!job) throw new HttpError(404, 'Offre introuvable ou non publiée');
  if (!cand) throw new HttpError(400, 'Complétez votre profil candidat avant de postuler');

  const { data, error } = await supabaseAdmin.from('applications')
    .insert({ job_id, candidate_id: cand.id, cv_url, cover_letter, status: 'submitted' }).select().single();
  if (error) throw new HttpError(error.code === '23505' ? 409 : 400, error.code === '23505' ? 'Déjà postulé' : error.message);

  const match = computeMatch({ candidate: cand, job });
  await supabaseAdmin.from('matching_results').upsert(
    { application_id: data.id, job_id, candidate_id: cand.id, ...match }, { onConflict: 'job_id,candidate_id' });
  ok(res, { ...data, match }, 201);
};

export const mine = async (req, res) => {
  const { data: cand } = await supabaseAdmin.from('candidate_profiles').select('id').eq('user_id', req.user.id).maybeSingle();
  const { data, error } = await supabaseAdmin.from('applications')
    .select('*, job_offers(title, location, companies(name))').eq('candidate_id', cand?.id).order('created_at', { ascending: false });
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};

export const forJob = async (req, res) => {
  await assertJobAccess(req.user, req.params.jobId);
  const { data, error } = await supabaseAdmin.from('applications')
    .select('*, candidate_profiles(*, profiles(full_name, avatar_url)), matching_results(score, matched_skills, missing_skills)')
    .eq('job_id', req.params.jobId).order('created_at', { ascending: false });
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};

export const setStatus = async (req, res) => {
  await assertApplicationAccess(req.user, req.params.id);
  const { data, error } = await supabaseAdmin.from('applications').update({ status: req.body.status }).eq('id', req.params.id).select('*, candidate_profiles(user_id), job_offers(title)').single();
  if (error) throw new HttpError(400, error.message);
  await supabaseAdmin.from('application_status_history').insert({ application_id: data.id, status: req.body.status, changed_by: req.user.id });
  // Notification au candidat (temps réel via Supabase Realtime)
  if (data.candidate_profiles?.user_id) {
    await supabaseAdmin.from('notifications').insert({
      user_id: data.candidate_profiles.user_id, type: 'application_status',
      title: data.job_offers?.title, body: req.body.status, data: { application_id: data.id, status: req.body.status } });
  }
  ok(res, { id: data.id, status: data.status });
};
