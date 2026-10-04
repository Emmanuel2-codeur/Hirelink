// Génération de documents RH : HTML autonome (A4, imprimable → « Enregistrer en PDF » dans le navigateur).
// Pourquoi HTML ? Rendu parfait de l'arabe (RTL, ligatures) sans moteur PDF lourd ; le document est recalculé à la demande
// à partir des données stockées (documents.data), donc toujours cohérent.
// ⚠ Ces modèles sont génériques : ils doivent être validés par un juriste avant tout usage réel.

const LOCALE = { fr: 'fr-FR', en: 'en-GB', ar: 'ar-u-nu-latn' };

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtDate = (d, lang) => {
  if (!d) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d);
  return new Intl.DateTimeFormat(LOCALE[lang] || LOCALE.fr, { dateStyle: 'long' }).format(date);
};

const T = {
  fr: {
    dir: 'ltr', place: 'Fait à', on: 'le', blank: '…………………', present: 'à ce jour',
    employer: "Pour l'entreprise", candidate: 'Le/La candidat(e)', trainee: 'Le/La stagiaire', school: "L'établissement d'enseignement", readApproved: '« Lu et approuvé »',
    generated: 'Document généré via HireLink — modèle à valider juridiquement',
    attestation: { title: 'ATTESTATION', body: [
      "Je soussigné(e) <b>{signatory}</b>, {signatory_title} de la société <b>{company}</b>, atteste que <b>{candidate}</b> exerce / a exercé au sein de notre société les fonctions de <b>{job}</b> du <b>{start}</b> au <b>{end}</b>.",
      "La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.",
      '{notes}'] },
    work_contract: { title: 'CONTRAT DE TRAVAIL', intro: "<b>Entre les soussignés :</b><br>La société <b>{company}</b>, {address}, immatriculée sous le n° <b>{siret}</b>, représentée par <b>{signatory}</b>, {signatory_title}, ci-après « l'Employeur » ;<br><b>Et :</b><br><b>{candidate}</b>, ci-après « le/la Salarié(e) ».",
      articles: [['Article 1 — Engagement', "Le/la Salarié(e) est engagé(e) en qualité de <b>{job}</b> à compter du <b>{start}</b>."], ['Article 2 — Lieu de travail', '{workplace}'],
        ['Article 3 — Rémunération', '{salary}'], ['Article 4 — Durée et conditions de travail', "La durée du travail et les conditions d'exercice des fonctions sont celles prévues par la législation applicable et les usages de l'entreprise."],
        ['Article 5 — Clauses complémentaires', '{notes}']] },
    internship_agreement: { title: 'CONVENTION DE STAGE', intro: "<b>Entre les soussignés :</b><br>La société d'accueil <b>{company}</b>, {address}, n° <b>{siret}</b>, représentée par <b>{signatory}</b>, {signatory_title} ;<br><b>Le/la stagiaire :</b> <b>{candidate}</b> ;<br>et l'établissement d'enseignement du/de la stagiaire.",
      articles: [['Article 1 — Objet', "La présente convention organise le stage de <b>{candidate}</b> au sein de la société sur le poste : <b>{job}</b>."], ['Article 2 — Durée', 'Le stage se déroule du <b>{start}</b> au <b>{end}</b>.'],
        ['Article 3 — Lieu', '{workplace}'], ['Article 4 — Missions', '{mission}'], ['Article 5 — Gratification', '{salary}'],
        ['Article 6 — Engagements', "Le/la stagiaire respecte le règlement intérieur et la confidentialité. L'entreprise désigne un tuteur et assure l'encadrement."], ['Article 7 — Clauses complémentaires', '{notes}']], threeParties: true },
  },
  en: {
    dir: 'ltr', place: 'Done at', on: 'on', blank: '…………………', present: 'to date',
    employer: 'For the company', candidate: 'The candidate', trainee: 'The intern', school: 'The educational institution', readApproved: '“Read and approved”',
    generated: 'Document generated via HireLink — template to be legally reviewed',
    attestation: { title: 'CERTIFICATE', body: [
      'I, the undersigned <b>{signatory}</b>, {signatory_title} of <b>{company}</b>, certify that <b>{candidate}</b> holds / held the position of <b>{job}</b> within our company from <b>{start}</b> to <b>{end}</b>.',
      'This certificate is issued to the person concerned for any legal purpose.', '{notes}'] },
    work_contract: { title: 'EMPLOYMENT CONTRACT', intro: '<b>Between:</b><br><b>{company}</b>, {address}, registration no. <b>{siret}</b>, represented by <b>{signatory}</b>, {signatory_title}, hereinafter “the Employer”;<br><b>And:</b><br><b>{candidate}</b>, hereinafter “the Employee”.',
      articles: [['Article 1 — Appointment', 'The Employee is hired as <b>{job}</b> starting on <b>{start}</b>.'], ['Article 2 — Place of work', '{workplace}'], ['Article 3 — Remuneration', '{salary}'],
        ['Article 4 — Working time and conditions', 'Working time and conditions follow the applicable legislation and company practice.'], ['Article 5 — Additional clauses', '{notes}']] },
    internship_agreement: { title: 'INTERNSHIP AGREEMENT', intro: '<b>Between:</b><br>The host company <b>{company}</b>, {address}, no. <b>{siret}</b>, represented by <b>{signatory}</b>, {signatory_title};<br>The intern: <b>{candidate}</b>;<br>and the intern’s educational institution.',
      articles: [['Article 1 — Purpose', 'This agreement governs the internship of <b>{candidate}</b> as: <b>{job}</b>.'], ['Article 2 — Duration', 'The internship runs from <b>{start}</b> to <b>{end}</b>.'], ['Article 3 — Place', '{workplace}'],
        ['Article 4 — Assignments', '{mission}'], ['Article 5 — Stipend', '{salary}'], ['Article 6 — Commitments', 'The intern complies with internal rules and confidentiality. The company appoints a tutor and provides supervision.'], ['Article 7 — Additional clauses', '{notes}']], threeParties: true },
  },
  ar: {
    dir: 'rtl', place: 'حُرِّر في', on: 'بتاريخ', blank: '…………………', present: 'إلى حدود اليوم',
    employer: 'عن المؤسسة', candidate: 'المرشح(ة)', trainee: 'المتدرب(ة)', school: 'المؤسسة التعليمية', readApproved: '«قُرئ وصودق عليه»',
    generated: 'وثيقة مُنشأة عبر HireLink — نموذج يجب التحقق منه قانونيًا',
    attestation: { title: 'شهادة', body: [
      'أنا الموقّع(ة) أدناه <b>{signatory}</b>، {signatory_title} بشركة <b>{company}</b>، أشهد بأن <b>{candidate}</b> يشغل / شغل لدى شركتنا منصب <b>{job}</b> من <b>{start}</b> إلى <b>{end}</b>.',
      'سُلّمت هذه الشهادة للمعني(ة) بالأمر لاستعمالها في حدود ما يسمح به القانون.', '{notes}'] },
    work_contract: { title: 'عقد عمل', intro: '<b>بين الموقّعَين أدناه:</b><br>شركة <b>{company}</b>، {address}، رقم التعريف <b>{siret}</b>، ويمثلها <b>{signatory}</b>، {signatory_title}، ويُشار إليها فيما يلي بـ«صاحب العمل»؛<br><b>و:</b><br><b>{candidate}</b>، ويُشار إليه فيما يلي بـ«الأجير».',
      articles: [['المادة 1 — التعيين', 'يُعيَّن الأجير في منصب <b>{job}</b> ابتداءً من <b>{start}</b>.'], ['المادة 2 — مكان العمل', '{workplace}'], ['المادة 3 — الأجر', '{salary}'],
        ['المادة 4 — مدة العمل وشروطه', 'تخضع مدة العمل وشروطه للتشريع الجاري به العمل وأعراف المؤسسة.'], ['المادة 5 — بنود إضافية', '{notes}']] },
    internship_agreement: { title: 'اتفاقية تدريب', intro: '<b>بين الموقّعين أدناه:</b><br>الشركة المستقبِلة <b>{company}</b>، {address}، رقم التعريف <b>{siret}</b>، ويمثلها <b>{signatory}</b>، {signatory_title}؛<br>المتدرب(ة): <b>{candidate}</b>؛<br>والمؤسسة التعليمية للمتدرب(ة).',
      articles: [['المادة 1 — الموضوع', 'تنظّم هذه الاتفاقية تدريب <b>{candidate}</b> لدى الشركة في منصب: <b>{job}</b>.'], ['المادة 2 — المدة', 'يمتد التدريب من <b>{start}</b> إلى <b>{end}</b>.'], ['المادة 3 — المكان', '{workplace}'],
        ['المادة 4 — المهام', '{mission}'], ['المادة 5 — التعويض', '{salary}'], ['المادة 6 — الالتزامات', 'يلتزم المتدرب بالنظام الداخلي وبالسرية. وتعيّن الشركة مؤطّرًا وتضمن المواكبة.'], ['المادة 7 — بنود إضافية', '{notes}']], threeParties: true },
  },
};

export const KINDS = ['work_contract', 'internship_agreement', 'attestation'];

export function renderDocument(doc) {
  const lang = T[doc.language] ? doc.language : 'fr';
  const L = T[lang], tpl = L[doc.kind];
  if (!tpl) throw new Error(`Type de document inconnu : ${doc.kind}`);
  const d = doc.data || {};
  const blank = `<span class="blank">${L.blank}</span>`;
  // <bdi> isole chaque valeur : noms latins, montants et dates restent dans le bon sens à l'intérieur d'une phrase arabe
  const v = (x, isDate) => (x ? `<bdi>${esc(isDate ? fmtDate(x, lang) : x)}</bdi>` : blank);
  const vars = {
    company: v(d.company?.name), address: v(d.company?.address), siret: v(d.company?.siret), candidate: v(d.candidate_name), job: v(d.job_title),
    signatory: v(d.signatory_name), signatory_title: esc(d.signatory_title || ''), start: v(d.start_date, true),
    end: d.end_date ? v(d.end_date, true) : esc(L.present), workplace: v(d.workplace), salary: v(d.salary), mission: v(d.mission), notes: d.notes ? esc(d.notes) : '',
  };
  // Les valeurs sont échappées AVANT insertion ; les modèles (de confiance) contiennent seulement <b> et <br>.
  const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));

  let content;
  if (doc.kind === 'attestation') {
    content = tpl.body.map((p) => fill(p)).filter((p) => p.trim()).map((p) => `<p>${p}</p>`).join('');
  } else {
    content = `<p>${fill(tpl.intro)}</p>` + tpl.articles
      .filter(([, body]) => !(body === '{notes}' && !d.notes))
      .map(([h, body]) => `<div class="art"><h2>${esc(h)}</h2><p>${fill(body)}</p></div>`).join('');
  }
  const issued = fmtDate(d.issued_at || new Date().toISOString(), lang);
  const sig = (label) => `<td class="sig"><div>${esc(label)}</div></td>`;
  const sigs = doc.kind === 'work_contract' ? [`${L.employer}`, `${L.candidate} — ${L.readApproved}`]
    : doc.kind === 'internship_agreement' ? [L.employer, `${L.trainee} — ${L.readApproved}`, L.school] : [L.employer];

  return `<!doctype html><html lang="${lang}" dir="${L.dir}"><head><meta charset="utf-8"><title>${esc(doc.title || tpl.title)}</title><style>
@page{size:A4;margin:20mm 18mm}
*{box-sizing:border-box}
body{font-family:'Noto Sans Arabic','Segoe UI',Inter,Arial,'DejaVu Sans',sans-serif;color:#222;line-height:1.65;font-size:12pt;margin:0;padding:24px}
.head{border-bottom:3px solid #3C6E71;padding-bottom:10px;margin-bottom:26px}
.head b{font-size:15pt;color:#284B63}.head small{display:block;color:#666}
h1{text-align:center;color:#284B63;letter-spacing:.08em;font-size:20pt;margin:22px 0 26px}
.art h2{font-size:12pt;color:#284B63;margin:16px 0 2px}.art p{margin:0}
p{margin:0 0 12px}.blank{color:#999}
table.sigs{width:100%;border-collapse:separate;border-spacing:18px 0;margin-top:56px}
td.sig{vertical-align:top;text-align:center;width:${Math.floor(100 / sigs.length)}%}
td.sig div{border-top:1px solid #888;padding-top:6px;min-height:90px;font-size:10.5pt}
.foot{margin-top:34px;font-size:9pt;color:#999;text-align:center;border-top:1px solid #ddd;padding-top:8px}
</style></head><body>
<div class="head"><b>${v(d.company?.name)}</b><small>${esc(d.company?.address || '')}</small></div>
<h1>${esc(tpl.title)}</h1>${content}
<p style="margin-top:26px">${esc(L.place)} ${esc(d.workplace || '')}, ${esc(L.on)} ${esc(issued)}</p>
<table class="sigs"><tr>${sigs.map(sig).join('')}</tr></table>
<div class="foot">${esc(L.generated)}</div></body></html>`;
}
