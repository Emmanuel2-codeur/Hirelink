import { supabaseAdmin, requireDb } from '../lib/supabase.js';
import { HttpError, ok } from '../lib/http.js';
import * as ai from '../services/ai.service.js';

export const me = async (req, res) => {
  const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).single();
  ok(res, { ...req.user, profile: data });
};
export const updateMe = async (req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').update(req.body).eq('id', req.user.id).select().single();
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};

export const myCandidateProfile = async (req, res) => {
  const { data } = await supabaseAdmin.from('candidate_profiles').select('*').eq('user_id', req.user.id).maybeSingle();
  ok(res, data);
};
export const upsertCandidateProfile = async (req, res) => {
  const { data, error } = await supabaseAdmin.from('candidate_profiles')
    .upsert({ ...req.body, user_id: req.user.id }, { onConflict: 'user_id' }).select().single();
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};

export const notifications = async (req, res) => {
  const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};
export const markRead = async (req, res) => {
  await supabaseAdmin.from('notifications').update({ read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
  ok(res, { id: req.params.id, read: true });
};

export const aiChat = async (req, res) => {
  const language = req.body.language || req.user.language;
  const reply = await ai.chat({ messages: req.body.messages, language, role: req.user.role });
  ok(res, { reply, language });
};
export const aiAnalyzeCv = async (req, res) => ok(res, ai.analyzeCvText(req.body.text));

export const adminStats = async (_req, res) => {
  if (!requireDb(res)) return;
  const count = async (t) => (await supabaseAdmin.from(t).select('*', { count: 'exact', head: true })).count ?? 0;
  const [users, companies, offers, applications] = await Promise.all(['profiles', 'companies', 'job_offers', 'applications'].map(count));
  ok(res, { users, companies, offers, applications });
};
export const pendingCompanies = async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('companies').select('*').eq('verification_status', 'pending').order('created_at');
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};
export const verifyCompany = async (req, res) => {
  const { data, error } = await supabaseAdmin.from('companies').update({ verification_status: req.body.status }).eq('id', req.params.id).select().single();
  if (error) throw new HttpError(400, error.message);
  await supabaseAdmin.from('audit_logs').insert({ actor_id: req.user.id, action: `company.${req.body.status}`, entity: 'companies', entity_id: req.params.id });
  ok(res, data);
};
export const auditLogs = async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};
