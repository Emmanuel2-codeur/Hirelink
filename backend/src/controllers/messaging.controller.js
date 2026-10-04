import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, ok } from '../lib/http.js';
import { assertJobAccess } from '../lib/access.js';
import { notify } from '../lib/notify.js';

// Une conversation = une candidature. Participants : le candidat + les membres de l'entreprise de l'offre.
// L'administrateur n'a volontairement PAS accès aux conversations privées.

async function loadApplication(id) {
  const { data } = await supabaseAdmin.from('applications')
    .select('id, job_id, candidate_profiles(user_id, profiles(full_name)), job_offers(title, company_id)').eq('id', id).maybeSingle();
  if (!data) throw new HttpError(404, 'Candidature introuvable');
  return data;
}

async function isParticipant(user, app) {
  if (app.candidate_profiles?.user_id === user.id) return true;
  if (user.role === 'admin' || user.role === 'candidate') return false;
  try { await assertJobAccess(user, app.job_id); return true; } catch { return false; }
}

async function assertMember(user, convId) {
  const { data: conv } = await supabaseAdmin.from('conversations').select('id, application_id').eq('id', convId).maybeSingle();
  if (!conv) throw new HttpError(404, 'Conversation introuvable');
  const { data: m } = await supabaseAdmin.from('conversation_members').select('user_id').eq('conversation_id', convId).eq('user_id', user.id).maybeSingle();
  if (!m) throw new HttpError(403, 'Accès refusé', 'FORBIDDEN');
  return conv;
}

const markRead = (convId, userId) =>
  Promise.all([
    supabaseAdmin.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', convId).eq('user_id', userId),
    supabaseAdmin.from('notifications').update({ read: true }).eq('user_id', userId).eq('type', 'new_message').eq('data->>conversation_id', convId),
  ]);

// POST /conversations { application_id } : ouvre (ou retrouve) la conversation d'une candidature
export const open = async (req, res) => {
  const app = await loadApplication(req.body.application_id);
  if (!(await isParticipant(req.user, app))) throw new HttpError(403, 'Accès refusé', 'FORBIDDEN');

  let { data: conv } = await supabaseAdmin.from('conversations').select('id').eq('application_id', app.id).maybeSingle();
  if (!conv) {
    const ins = await supabaseAdmin.from('conversations').insert({ application_id: app.id }).select('id').single();
    if (ins.error && ins.error.code === '23505') conv = (await supabaseAdmin.from('conversations').select('id').eq('application_id', app.id).single()).data; // course : déjà créée
    else if (ins.error) throw new HttpError(400, ins.error.message);
    else conv = ins.data;
  }
  const { data: cm } = await supabaseAdmin.from('company_members').select('user_id').eq('company_id', app.job_offers.company_id);
  const ids = [...new Set([app.candidate_profiles?.user_id, ...(cm || []).map((m) => m.user_id)].filter(Boolean))];
  await supabaseAdmin.from('conversation_members')
    .upsert(ids.map((user_id) => ({ conversation_id: conv.id, user_id })), { onConflict: 'conversation_id,user_id', ignoreDuplicates: true });
  ok(res, { id: conv.id });
};

// GET /conversations : mes conversations, dernier message et non-lus
export const list = async (req, res) => {
  const { data: mem, error } = await supabaseAdmin.from('conversation_members')
    .select('last_read_at, conversations(id, created_at, last_message_at, application_id, applications(job_offers(title, companies(name)), candidate_profiles(user_id, profiles(full_name))))')
    .eq('user_id', req.user.id);
  if (error) throw new HttpError(400, error.message);
  const rows = (mem || []).filter((m) => m.conversations);
  if (!rows.length) return ok(res, []);

  const ids = rows.map((m) => m.conversations.id);
  const { data: msgs } = await supabaseAdmin.from('messages').select('conversation_id, sender_id, body, created_at')
    .in('conversation_id', ids).order('created_at', { ascending: false }).limit(1000);

  const out = rows.map((m) => {
    const c = m.conversations, a = c.applications;
    const mine = (msgs || []).filter((x) => x.conversation_id === c.id);
    const last = mine[0] || null;
    const iAmCandidate = a?.candidate_profiles?.user_id === req.user.id;
    return {
      id: c.id, application_id: c.application_id, job_title: a?.job_offers?.title, company: a?.job_offers?.companies?.name,
      other_name: iAmCandidate ? a?.job_offers?.companies?.name : a?.candidate_profiles?.profiles?.full_name,
      last_message: last && { body: last.body, created_at: last.created_at, mine: last.sender_id === req.user.id },
      unread: mine.filter((x) => x.sender_id !== req.user.id && new Date(x.created_at) > new Date(m.last_read_at)).length,
      sort_at: last?.created_at || c.created_at,
    };
  }).sort((x, y) => new Date(y.sort_at) - new Date(x.sort_at));
  ok(res, out);
};

// GET /conversations/:id/messages : 100 derniers messages (marque comme lu)
export const messages = async (req, res) => {
  await assertMember(req.user, req.params.id);
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const { data, error } = await supabaseAdmin.from('messages').select('id, conversation_id, sender_id, body, created_at')
    .eq('conversation_id', req.params.id).order('created_at', { ascending: false }).limit(limit);
  if (error) throw new HttpError(400, error.message);
  await markRead(req.params.id, req.user.id);
  ok(res, data.reverse());
};

// POST /conversations/:id/messages { body }
export const send = async (req, res) => {
  const conv = await assertMember(req.user, req.params.id);
  const { data: msg, error } = await supabaseAdmin.from('messages')
    .insert({ conversation_id: conv.id, sender_id: req.user.id, body: req.body.body })
    .select('id, conversation_id, sender_id, body, created_at').single();
  if (error) throw new HttpError(400, error.message);
  await supabaseAdmin.from('conversations').update({ last_message_at: msg.created_at }).eq('id', conv.id);
  await markRead(conv.id, req.user.id);

  // Notifier les autres participants (une seule notification non lue par conversation : pas de spam)
  const { data: others } = await supabaseAdmin.from('conversation_members').select('user_id').eq('conversation_id', conv.id).neq('user_id', req.user.id);
  const { data: app } = await supabaseAdmin.from('applications').select('job_offers(title)').eq('id', conv.application_id).maybeSingle();
  for (const o of others || []) {
    const { data: pending } = await supabaseAdmin.from('notifications').select('id').eq('user_id', o.user_id).eq('type', 'new_message')
      .eq('read', false).eq('data->>conversation_id', conv.id).limit(1);
    if (!pending?.length) await notify(o.user_id, 'new_message', app?.job_offers?.title, { conversation_id: conv.id });
  }
  ok(res, msg, 201);
};

export const read = async (req, res) => {
  await assertMember(req.user, req.params.id);
  await markRead(req.params.id, req.user.id);
  ok(res, { read: true });
};
