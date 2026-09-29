import { supabaseAdmin, requireDb } from '../lib/supabase.js';
import { HttpError, ok } from '../lib/http.js';
import { assertJobAccess } from '../lib/access.js';

export const list = async (req, res) => {
  if (!requireDb(res)) return;
  const { q, type, location, work_mode, page = 1, limit = 20 } = req.query;
  let query = supabaseAdmin.from('job_offers').select('*, companies(name, logo_url)', { count: 'exact' })
    .eq('status', 'published').order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (q) query = query.ilike('title', `%${q}%`);
  if (type) query = query.eq('type', type);
  if (work_mode) query = query.eq('work_mode', work_mode);
  if (location) query = query.ilike('location', `%${location}%`);
  const { data, error, count } = await query;
  if (error) throw new HttpError(400, error.message);
  res.json({ data, meta: { page: +page, limit: +limit, total: count } });
};

export const getOne = async (req, res) => {
  if (!requireDb(res)) return;
  const { data, error } = await supabaseAdmin.from('job_offers').select('*, companies(*)').eq('id', req.params.id).single();
  if (error) throw new HttpError(404, 'Offre introuvable');
  ok(res, data);
};

export const create = async (req, res) => {
  const { data: member } = await supabaseAdmin.from('company_members').select('company_id').eq('user_id', req.user.id).limit(1).maybeSingle();
  if (!member) throw new HttpError(403, 'Aucune entreprise rattachée à ce recruteur');
  const { data, error } = await supabaseAdmin.from('job_offers')
    .insert({ ...req.body, company_id: member.company_id, created_by: req.user.id }).select().single();
  if (error) throw new HttpError(400, error.message);
  ok(res, data, 201);
};

export const update = async (req, res) => {
  await assertJobAccess(req.user, req.params.id);
  const { data, error } = await supabaseAdmin.from('job_offers').update(req.body).eq('id', req.params.id).select().single();
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};

export const setStatus = async (req, res) => {
  await assertJobAccess(req.user, req.params.id);
  const patch = { status: req.body.status, ...(req.body.status === 'published' ? { published_at: new Date().toISOString() } : {}) };
  const { data, error } = await supabaseAdmin.from('job_offers').update(patch).eq('id', req.params.id).select().single();
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};

// Offres des entreprises auxquelles appartient le recruteur (avec nombre de candidatures)
export const mine = async (req, res) => {
  const { data: members } = await supabaseAdmin.from('company_members').select('company_id').eq('user_id', req.user.id);
  const ids = (members || []).map((m) => m.company_id);
  if (!ids.length) return ok(res, []);
  const { data, error } = await supabaseAdmin.from('job_offers').select('*, applications(count)')
    .in('company_id', ids).order('created_at', { ascending: false });
  if (error) throw new HttpError(400, error.message);
  ok(res, data.map((j) => ({ ...j, applications_count: j.applications?.[0]?.count ?? 0 })));
};
