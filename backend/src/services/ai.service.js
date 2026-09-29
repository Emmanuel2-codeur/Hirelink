import { env } from '../config/env.js';

const LANG_NAME = { fr: 'français', en: 'English', ar: 'العربية' };
const systemPrompt = (lang, role) =>
  `Tu es l'assistant IA de HireLink (plateforme de recrutement). Rôle de l'utilisateur : ${role}. ` +
  `Réponds STRICTEMENT en ${LANG_NAME[lang] || LANG_NAME.fr}. Tu assistes ; la décision finale appartient à l'humain.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geminiOnce(model, messages, system) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    }),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    const err = new Error(`Gemini ${r.status} (${model}) ${detail.slice(0, 200)}`);
    err.status = r.status;
    throw err;
  }
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
}

async function callGemini(messages, system) {
  const retryable = (s) => s === 503 || s === 429 || s === 500;
  const models = [env.geminiModel, env.geminiFallbackModel].filter((m, i, a) => m && a.indexOf(m) === i);
  let lastErr;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return await geminiOnce(model, messages, system); }
      catch (e) {
        lastErr = e;
        if (!retryable(e.status)) break;          // erreur définitive : on passe au modèle suivant
        await sleep(800 * 2 ** attempt);           // 0,8 s → 1,6 s → 3,2 s
      }
    }
  }
  throw lastErr;
}

async function callOpenAI(messages, system) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.openaiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: system }, ...messages] }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? '';
}

const DEMO = {
  fr: "Mode démo : aucune clé IA configurée. Ajoutez GEMINI_API_KEY ou OPENAI_API_KEY dans backend/.env pour activer l'assistant.",
  en: 'Demo mode: no AI key configured. Add GEMINI_API_KEY or OPENAI_API_KEY in backend/.env to enable the assistant.',
  ar: 'وضع تجريبي: لم يتم إعداد مفتاح الذكاء الاصطناعي. أضف GEMINI_API_KEY أو OPENAI_API_KEY في backend/.env لتفعيل المساعد.',
};

export async function chat({ messages, language = 'fr', role = 'candidate' }) {
  const system = systemPrompt(language, role);
  if (env.aiProvider === 'openai' && env.openaiKey) return callOpenAI(messages, system);
  if (env.geminiKey) return callGemini(messages, system);
  if (env.openaiKey) return callOpenAI(messages, system);
  return DEMO[language] || DEMO.fr;
}

// Analyse de CV : heuristique locale en attendant parsing PDF + LLM.
const KNOWN_SKILLS = ['react','node.js','python','sql','postgresql','docker','kubernetes','terraform','aws','typescript','javascript','java','git','fastapi','django','tailwind','figma','excel'];
export function analyzeCvText(text = '') {
  const t = text.toLowerCase();
  return { skills: KNOWN_SKILLS.filter((s) => t.includes(s)), source: 'heuristic' };
}
