import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler as h } from '../lib/http.js';
import { ownedCrud } from '../controllers/generic.controller.js';
import * as jobs from '../controllers/jobs.controller.js';
import * as apps from '../controllers/applications.controller.js';
import * as m from '../controllers/misc.controller.js';
import * as chat from '../controllers/messaging.controller.js';
import * as docs from '../controllers/documents.controller.js';
import * as iv from '../controllers/interviews.controller.js';
import * as cand from '../controllers/candidates.controller.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const aiLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMIT', message: 'Trop de requêtes IA, réessayez dans une minute' } } });

const r = Router();
const auth = authenticate;
const recruiter = requireRole('recruiter', 'company', 'admin');
const admin = requireRole('admin');

// ---------- schémas
const jobBody = z.object({
  title: z.string().min(3),
  type: z.enum(['job', 'internship']).default('job'),
  description: z.string().optional(),
  missions: z.string().optional(),
  required_skills: z.array(z.string()).default([]),
  nice_to_have_skills: z.array(z.string()).default([]),
  min_experience_years: z.number().int().min(0).default(0),
  education_level: z.string().optional(),
  location: z.string().optional(),
  work_mode: z.enum(['onsite', 'hybrid', 'remote']).default('onsite'),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  match_threshold: z.number().int().min(0).max(100).default(80),
  status: z.enum(['draft', 'published', 'suspended', 'expired', 'archived']).default('draft'),
});
const statusBody = (values) => z.object({ status: z.enum(values) });
const applyBody = z.object({ job_id: z.string().uuid(), cv_url: z.string().optional(), cover_letter: z.string().optional() });
const chatBody = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1) })).min(1),
  language: z.enum(['fr', 'en', 'ar']).optional(),
});
const profilePatch = z.object({ full_name: z.string().optional(), language: z.enum(['fr', 'en', 'ar']).optional(), avatar_url: z.string().optional() });
const candidateBody = z.object({
  headline: z.string().optional(), bio: z.string().optional(), location: z.string().optional(),
  skills: z.array(z.string()).default([]), experience_years: z.number().int().min(0).default(0),
  languages: z.array(z.string()).default([]), availability: z.string().optional(), cv_url: z.string().optional(),
});

// ---------- /api/auth & /api/users (l'inscription/connexion se fait via Supabase Auth côté client)
r.get('/auth/me', auth, h(m.me));
r.get('/users/me', auth, h(m.me));
r.patch('/users/me', auth, validate(profilePatch), h(m.updateMe));

// ---------- /api/candidates
r.get('/candidates/me', auth, h(m.myCandidateProfile));
r.post('/candidates/me/cv', auth, requireRole('candidate'), aiLimiter, upload.single('cv'), h(cand.uploadCv));
r.put('/candidates/me', auth, requireRole('candidate'), validate(candidateBody), h(m.upsertCandidateProfile));

// ---------- /api/jobs
r.get('/jobs', h(jobs.list));
r.get('/jobs/mine', auth, recruiter, h(jobs.mine));   // avant /jobs/:id
r.get('/jobs/:id', h(jobs.getOne));
r.post('/jobs', auth, recruiter, validate(jobBody), h(jobs.create));
r.patch('/jobs/:id', auth, recruiter, validate(jobBody.partial()), h(jobs.update));
r.patch('/jobs/:id/status', auth, recruiter, validate(statusBody(['draft', 'published', 'suspended', 'expired', 'archived'])), h(jobs.setStatus));

// ---------- /api/applications
r.post('/applications', auth, requireRole('candidate'), validate(applyBody), h(apps.apply));
r.get('/applications/mine', auth, requireRole('candidate'), h(apps.mine));
r.get('/applications/job/:jobId', auth, recruiter, h(apps.forJob));
r.patch('/applications/:id/status', auth, recruiter,
  validate(statusBody(['submitted', 'in_review', 'shortlisted', 'interview', 'accepted', 'rejected'])), h(apps.setStatus));

// ---------- /api/interviews, /api/recruitments, /api/documents, /api/messages (CRUD de base, à enrichir)
const interviewBody = z.object({
  application_id: z.string().uuid(),
  scheduled_at: z.string().datetime({ offset: true }),
  type: z.enum(['video', 'onsite', 'phone']).default('video'),
  location_or_link: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});
r.get('/interviews', auth, h(iv.list));
r.post('/interviews', auth, recruiter, validate(interviewBody), h(iv.create));
r.patch('/interviews/:id/status', auth, recruiter, validate(statusBody(['scheduled', 'done', 'cancelled'])), h(iv.setStatus));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
const short = (n) => z.string().trim().max(n).optional();
const docBody = z.object({
  application_id: z.string().uuid(),
  kind: z.enum(['work_contract', 'internship_agreement', 'attestation']),
  language: z.enum(['fr', 'en', 'ar']).default('fr'),
  fields: z.object({
    start_date: date, end_date: date, salary: short(200), workplace: short(200), mission: short(1000),
    signatory_name: short(120), signatory_title: short(120), notes: short(1500),
  }).default({}),
});
r.get('/documents', auth, h(docs.list));
r.post('/documents/generate', auth, recruiter, validate(docBody), h(docs.generate));
r.get('/documents/:id/html', auth, h(docs.html));
r.delete('/documents/:id', auth, recruiter, h(docs.remove));
const recruitments = ownedCrud('recruitments', 'created_by');
r.get('/recruitments', auth, recruiter, h(recruitments.list));
r.post('/recruitments', auth, recruiter, h(recruitments.create));
// ---------- messagerie (une conversation par candidature)
const msgLimiter = rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMIT', message: 'Trop de messages, patientez un instant' } } });
r.get('/conversations', auth, h(chat.list));
r.post('/conversations', auth, validate(z.object({ application_id: z.string().uuid() })), h(chat.open));
r.get('/conversations/:id/messages', auth, h(chat.messages));
r.post('/conversations/:id/messages', auth, msgLimiter, validate(z.object({ body: z.string().trim().min(1).max(2000) })), h(chat.send));
r.patch('/conversations/:id/read', auth, h(chat.read));

// ---------- /api/companies & /api/recruiters
const companyBody = z.object({
  name: z.string().min(2), sector: z.string().optional(), location: z.string().optional(),
  website: z.string().optional(), description: z.string().optional(), siret: z.string().optional(),
}); // champs whitelistés : impossible de s'auto-vérifier via verification_status
const companies = ownedCrud('companies', 'owner_id');
r.get('/companies/mine', auth, recruiter, h(companies.list));
r.post('/companies', auth, recruiter, validate(companyBody), h(companies.create));
r.get('/recruiters/me', auth, recruiter, h(m.me));

// ---------- /api/notifications
r.get('/notifications', auth, h(m.notifications));
r.patch('/notifications/read-all', auth, h(m.markAllRead));
r.patch('/notifications/:id/read', auth, h(m.markRead));

// ---------- /api/ai
r.post('/ai/chat', auth, validate(chatBody), h(m.aiChat));
r.post('/ai/analyze-cv', auth, validate(z.object({ text: z.string().min(1) })), h(m.aiAnalyzeCv));

// ---------- /api/admin
r.get('/admin/stats', auth, admin, h(m.adminStats));
r.get('/admin/companies/pending', auth, admin, h(m.pendingCompanies));
r.patch('/admin/companies/:id', auth, admin, validate(statusBody(['verified', 'rejected', 'pending'])), h(m.verifyCompany));
r.get('/admin/audit-logs', auth, admin, h(m.auditLogs));

export default r;
