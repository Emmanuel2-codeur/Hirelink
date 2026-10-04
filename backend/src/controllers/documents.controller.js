import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, ok } from '../lib/http.js';
import { assertApplicationAccess } from '../lib/access.js';
import { notify } from '../lib/notify.js';
import { renderDocument } from '../services/documents.service.js';

const COLS = 'id, kind, title, language, created_at, owner_id, recipient_id, data';

// POST /documents/generate (recruteur) : crée le document à partir d'une candidature, prévient le candidat
export const generate = async (req, res) => {
  const { application_id, kind, language, fields } = req.body;
  await assertApplicationAccess(req.user, application_id);
  const { data: app, error } = await supabaseAdmin.from('applications')
    .select('id, candidate_profiles(user_id, profiles(full_name)), job_offers(title, location, companies(name, location, siret))')
    .eq('id', application_id).single();
  if (error || !app) throw new HttpError(404, 'Candidature introuvable');

  const job = app.job_offers, company = job.companies;
  const data = {
    company: { name: company.name, address: company.location || '', siret: company.siret || '' },
    candidate_name: app.candidate_profiles?.profiles?.full_name || '',
    job_title: job.title,
    ...fields,
    workplace: fields.workplace || job.location || '',
    issued_at: new Date().toISOString(),
  };
  const recipient = app.candidate_profiles?.user_id || null;
  const title = `${job.title} — ${data.candidate_name}`;
  const { data: doc, error: e2 } = await supabaseAdmin.from('documents')
    .insert({ owner_id: req.user.id, recipient_id: recipient, kind, language, title, data }).select(COLS).single();
  if (e2) throw new HttpError(400, e2.message);
  await notify(recipient, 'document_available', title, { document_id: doc.id, kind });
  ok(res, doc, 201);
};

// GET /documents : documents que j'ai créés ou qui me sont destinés
export const list = async (req, res) => {
  const { data, error } = await supabaseAdmin.from('documents').select(COLS)
    .or(`owner_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`).order('created_at', { ascending: false });
  if (error) throw new HttpError(400, error.message);
  ok(res, data);
};

// GET /documents/:id/html : HTML prêt à imprimer (accès : créateur, destinataire, admin)
export const html = async (req, res) => {
  const { data: doc } = await supabaseAdmin.from('documents').select(COLS).eq('id', req.params.id).maybeSingle();
  if (!doc) throw new HttpError(404, 'Document introuvable');
  if (doc.owner_id !== req.user.id && doc.recipient_id !== req.user.id && req.user.role !== 'admin') throw new HttpError(403, 'Accès refusé', 'FORBIDDEN');
  ok(res, { title: doc.title, html: renderDocument(doc) });
};

export const remove = async (req, res) => {
  const { data, error } = await supabaseAdmin.from('documents').delete().eq('id', req.params.id).eq('owner_id', req.user.id).select('id');
  if (error) throw new HttpError(400, error.message);
  if (!data?.length) throw new HttpError(404, 'Document introuvable');
  ok(res, { id: req.params.id, deleted: true });
};
