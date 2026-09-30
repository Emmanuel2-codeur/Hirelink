import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, ok } from '../lib/http.js';
import { analyzeCv, detectKind, extractText } from '../services/cv.service.js';

const union = (a = [], b = []) => {
  const seen = new Map();
  [...a, ...b].forEach((x) => { const k = String(x).toLowerCase(); if (!seen.has(k)) seen.set(k, x); });
  return [...seen.values()];
};

// POST /candidates/me/cv  (multipart, champ « cv »)
export const uploadCv = async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Fichier manquant (champ « cv »)');
  const kind = detectKind(req.file.buffer);
  const text = await extractText(req.file.buffer);
  if (text.trim().length < 80) throw new HttpError(422, 'Aucun texte exploitable (PDF scanné ?). Utilisez un PDF texte ou un DOCX.', 'CV_EMPTY');

  const analysis = await analyzeCv(text);
  const x = analysis.extracted;

  // Archivage privé : bucket « cvs », dossier = id de l'utilisateur (cf. politiques Storage)
  const path = `${req.user.id}/${Date.now()}.${kind}`;
  const { error: upErr } = await supabaseAdmin.storage.from('cvs').upload(path, req.file.buffer, {
    contentType: kind === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  if (upErr) console.warn('Stockage du CV impossible :', upErr.message);

  const { data: cur } = await supabaseAdmin.from('candidate_profiles').select('*').eq('user_id', req.user.id).maybeSingle();
  const patch = {
    user_id: req.user.id,
    skills: union(cur?.skills, x.skills),
    languages: union(cur?.languages, x.languages),
    experience_years: Math.max(cur?.experience_years || 0, Math.round(x.experience_years)),
    headline: cur?.headline || x.headline || null,
    location: cur?.location || x.location || null,
    cv_url: upErr ? cur?.cv_url ?? null : path,
    updated_at: new Date().toISOString(),
  };
  const { data: profile, error } = await supabaseAdmin.from('candidate_profiles').upsert(patch, { onConflict: 'user_id' }).select().single();
  if (error) throw new HttpError(400, error.message);

  await supabaseAdmin.from('cv_analyses').insert({ candidate_id: profile.id, extracted: { ...x, source: analysis.source }, clarity_score: analysis.clarity });
  ok(res, { profile, analysis: { ...x, source: analysis.source, clarity: analysis.clarity }, stored: !upErr });
};
