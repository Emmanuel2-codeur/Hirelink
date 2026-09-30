// Matching CV / offre : compétences (60 %), expérience (25 %), localisation (15 %).
const norm = (s) => String(s || '').toLowerCase().trim();

export function computeMatch({ candidate, job }) {
  const required = (job.required_skills || []).map(norm);
  const nice = (job.nice_to_have_skills || []).map(norm);
  const have = new Set((candidate.skills || []).map(norm));

  const reqHit = required.filter((s) => have.has(s));
  const niceHit = nice.filter((s) => have.has(s));
  const skillsScore = required.length
    ? (reqHit.length / required.length) * 0.8 + (nice.length ? (niceHit.length / nice.length) * 0.2 : 0.2)
    : 0.5;

  const minExp = job.min_experience_years ?? 0;
  const exp = candidate.experience_years ?? 0;
  const expScore = minExp === 0 ? 1 : Math.min(exp / minExp, 1);

  const locScore = !job.location || !candidate.location ? 0.5
    : norm(job.location) === norm(candidate.location) || job.work_mode === 'remote' ? 1 : 0.3;

  const score = Math.round((skillsScore * 0.6 + expScore * 0.25 + locScore * 0.15) * 100);
  return {
    score,
    matched_skills: reqHit,
    missing_skills: required.filter((s) => !have.has(s)),
    breakdown: { skills: Math.round(skillsScore * 100), experience: Math.round(expScore * 100), location: Math.round(locScore * 100) },
  };
}
