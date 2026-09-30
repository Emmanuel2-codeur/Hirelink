import pdf from 'pdf-parse/lib/pdf-parse.js'; // import direct : évite le fichier de test du package
import mammoth from 'mammoth';
import { z } from 'zod';
import * as ai from './ai.service.js';
import { HttpError } from '../lib/http.js';

// Détection par « magic bytes » (on ne se fie pas au type MIME envoyé par le client)
export function detectKind(buf) {
  if (buf.subarray(0, 4).toString() === '%PDF') return 'pdf';
  if (buf[0] === 0x50 && buf[1] === 0x4b) return 'docx';
  return null;
}

export async function extractText(buffer) {
  const kind = detectKind(buffer);
  try {
    if (kind === 'pdf') return (await pdf(buffer)).text || '';
    if (kind === 'docx') return (await mammoth.extractRawText({ buffer })).value || '';
  } catch {
    throw new HttpError(422, 'Fichier illisible ou corrompu', 'CV_UNREADABLE');
  }
  throw new HttpError(415, 'Format non supporté : PDF ou DOCX uniquement', 'UNSUPPORTED_MEDIA');
}

const schema = z.object({
  headline: z.string().max(120).catch(''),
  skills: z.array(z.string().trim().min(1).max(40)).max(40).catch([]),
  experience_years: z.number().min(0).max(60).catch(0),
  languages: z.array(z.string().max(30)).max(10).catch([]),
  location: z.string().max(80).catch(''),
});

const guessYears = (t) => {
  const nums = [...t.matchAll(/(\d{1,2})\s*(?:\+\s*)?(?:ans|an|years?|yrs)\b/gi)].map((m) => +m[1]).filter((n) => n <= 40);
  return nums.length ? Math.max(...nums) : 0;
};

// Score de clarté (0-100) : longueur exploitable, sections repérées, compétences détectées
export function clarityScore(text, ex) {
  let s = 0;
  s += Math.min(text.length / 3000, 1) * 30;
  const sections = ['expérience', 'experience', 'formation', 'education', 'compétences', 'skills', 'projet', 'project', 'langues', 'languages'];
  s += Math.min(sections.filter((k) => text.toLowerCase().includes(k)).length / 4, 1) * 30;
  s += Math.min(ex.skills.length / 8, 1) * 30;
  s += /@/.test(text) ? 10 : 0;
  return Math.round(s);
}

export async function analyzeCv(rawText) {
  const text = rawText.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 12000);
  let extracted = null, source = 'heuristic';
  try {
    const json = await ai.extractCvJson(text);
    if (json) { extracted = schema.parse(json); source = 'ai'; }
  } catch (e) { console.warn('Extraction IA du CV indisponible :', e.message); }
  if (!extracted) {
    extracted = { headline: '', skills: ai.analyzeCvText(text).skills, experience_years: guessYears(text), languages: [], location: '' };
  }
  return { extracted, source, clarity: clarityScore(text, extracted), characters: text.length };
}
