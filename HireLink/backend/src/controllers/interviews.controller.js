import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, ok } from '../lib/http.js';
import { assertApplicationAccess, assertJobAccess } from '../lib/access.js';
import { notify } from '../lib/notify.js';

const SELECT = '*, job_offers(title, companies(name)), candidate_profiles(headline, user_id, profiles(full_name))';

// POST /interviews (recruteur) : planifie, passe la candidature en « interview » et prévient le candidat
export const create = async (req, res) => {
  const { application_id, scheduled_at, type, location_or_link, notes } = req.body;
  if (new Date(scheduled_at).getTime() < Date.now()) throw new HttpError(422, 'La date de l’entretien doit être dans le futur', 'PAST_DATE');
  const app = await assertApplicationAccess(req.user, application_id);

  const { data, error } = await supabaseAdmin.from('interviews').insert({
    application_id, job_id: app.job_id, candidate_id: app.candidate_id, created_by: req.user.id,
    scheduled_at, type, location_or_link, notes, status: 'scheduled',
  }).select(SELECT).single();
  if (error) throw new HttpError(400, error.message);

  await supabaseAdmin.from('applications').update({ status: 'interview' }).eq('id', application_id);
  await supabaseAdmin.from('application_status_history').insert({ application_id, status: 'interview', changed_by: req.user.id });
  await notify(data.candidate_profiles?.user_id, 'interview_scheduled', data.job_offers?.title,
    { interview_id: data.id, application_id, scheduled_at, type });
  ok(res, data, 201);
};

// GET /interviews : candidat = les siens ; recruteur = ceux de ses offres ; admin = tous
export const list = async (req, res) => {
  let q = supabaseAdmin.from('interviews').select(SELECT).order('scheduled_at', { ascending: true });
  if (req.user.role === 'candidate') {
    const { data: c } = await supabaseAdmin.from('candidate_profiles').select('id').eq('user_id', req.user.id).maybeSingle();
    if (!c) return ok(res, []);
    q = q.eq('candidate_id', c.id);
  } else if (req.user.role !== 'admin') {
    const { data: members } = await supabaseAdmin.from('company_members').select('company_id').eq('user_id', req.user.id);
    const companyIds = (members || []).map((m) => m.company_id);
    if (!companyIds.length) return ok(res, []);
    const { data: jobs } = await supabaseAdmin.from('job_offers').select('id').in('company_id', companyIds);
    const jobIds = (jobs || []).map((j) => j.id);
    if (!jobIds.length) return ok(res, []);
    q = q.in('job_id', jobIds);
  }
  const { data, error } = await q;
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};

// PATCH /interviews/:id/status (recruteur) : terminé / annulé
export const setStatus = async (req, res) => {
  const { data: cur } = await supabaseAdmin.from('interviews').select('job_id').eq('id', req.params.id).maybeSingle();
  if (!cur) throw new HttpError(404, 'Entretien introuvable');
  await assertJobAccess(req.user, cur.job_id);
  const { data, error } = await supabaseAdmin.from('interviews').update({ status: req.body.status }).eq('id', req.params.id).select(SELECT).single();
  if (error) throw new HttpError(400, error.message);
  if (req.body.status === 'cancelled') {
    await notify(data.candidate_profiles?.user_id, 'interview_cancelled', data.job_offers?.title, { interview_id: data.id, scheduled_at: data.scheduled_at });
  }
  ok(res, data);
};
