-- =====================================================================
-- HireLink — Base de données complète (PostgreSQL / Supabase)
-- Contenu : 1) schéma  2) sécurité RLS + stockage + realtime  3) données initiales
-- Exécution : Supabase > SQL Editor > coller tout le fichier > Run
-- Généré le 2026-09-30 à partir de supabase/migrations et supabase/seed.sql
-- =====================================================================

-- ################ 1) SCHEMA ################
-- HireLink — schéma initial (PostgreSQL / Supabase)
create extension if not exists "pgcrypto";

-- ===== Types
create type user_role         as enum ('candidate','recruiter','company','admin');
create type lang_code         as enum ('fr','en','ar');
create type job_type          as enum ('job','internship');
create type work_mode         as enum ('onsite','hybrid','remote');
create type job_status        as enum ('draft','published','suspended','expired','archived');
create type application_status as enum ('submitted','in_review','shortlisted','interview','accepted','rejected');
create type verification_status as enum ('pending','verified','rejected');
create type interview_status  as enum ('scheduled','done','cancelled');

-- ===== Utilisateurs
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'candidate',
  full_name   text,
  avatar_url  text,
  language    lang_code not null default 'fr',   -- persistance langue + langue de l'IA
  created_at  timestamptz not null default now()
);

-- Création automatique du profil à l'inscription (rôle lu dans les metadata, jamais 'admin')
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, language)
  values (new.id,
          new.raw_user_meta_data->>'full_name',
          coalesce(nullif(new.raw_user_meta_data->>'role','admin'),'candidate')::user_role,
          coalesce(new.raw_user_meta_data->>'language','fr')::lang_code);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ===== Candidats
create table public.skills (id serial primary key, name text unique not null);
create table public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  headline text, bio text, location text,
  skills text[] not null default '{}',
  languages text[] not null default '{}',
  experience_years int not null default 0,
  availability text, cv_url text,
  completeness int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.educations (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidate_profiles(id) on delete cascade, school text, degree text, start_year int, end_year int);
create table public.experiences (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidate_profiles(id) on delete cascade, company text, title text, start_date date, end_date date, description text);
create table public.certifications (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidate_profiles(id) on delete cascade, name text, issuer text, year int);

-- ===== Entreprises
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null, logo_url text, description text, sector text, location text, website text, size text,
  siret text, verification_status verification_status not null default 'pending',
  created_at timestamptz not null default now()
);
create table public.company_members (
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  member_role text not null default 'recruiter',
  primary key (company_id, user_id)
);
create or replace function public.add_company_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null then
    insert into public.company_members(company_id, user_id, member_role) values (new.id, new.owner_id, 'owner') on conflict do nothing;
  end if; return new;
end $$;
create trigger on_company_created after insert on public.companies for each row execute function public.add_company_owner();

-- ===== Recrutement
create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null, type job_type not null default 'job',
  description text, missions text,
  required_skills text[] not null default '{}', nice_to_have_skills text[] not null default '{}',
  min_experience_years int not null default 0, education_level text,
  location text, work_mode work_mode not null default 'onsite',
  salary_min numeric, salary_max numeric, duration_months int,
  match_threshold int not null default 80,
  status job_status not null default 'draft',
  published_at timestamptz, expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.job_offers (status, published_at desc);
create index on public.job_offers using gin (required_skills);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_offers(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  cv_url text, cover_letter text,
  status application_status not null default 'submitted',
  created_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);
create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  status application_status not null, changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  job_id uuid references public.job_offers(id),
  candidate_id uuid references public.candidate_profiles(id),
  created_by uuid references public.profiles(id) on delete set null,
  scheduled_at timestamptz, type text, location_or_link text, notes text,
  status interview_status not null default 'scheduled',
  created_at timestamptz not null default now()
);
create table public.recruitments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete set null,
  job_id uuid references public.job_offers(id), candidate_id uuid references public.candidate_profiles(id),
  created_by uuid references public.profiles(id) on delete set null, start_date date, created_at timestamptz not null default now()
);

-- ===== IA
create table public.cv_analyses (id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidate_profiles(id) on delete cascade, extracted jsonb, clarity_score numeric, created_at timestamptz not null default now());
create table public.matching_results (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  job_id uuid not null references public.job_offers(id) on delete cascade,
  candidate_id uuid not null references public.candidate_profiles(id) on delete cascade,
  score int not null, matched_skills text[] default '{}', missing_skills text[] default '{}', breakdown jsonb,
  created_at timestamptz not null default now(), unique (job_id, candidate_id)
);
create table public.recommendations (id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidate_profiles(id) on delete cascade, job_id uuid references public.job_offers(id) on delete cascade, score int, created_at timestamptz not null default now());
create table public.ai_conversations (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, title text, created_at timestamptz not null default now());
create table public.ai_messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.ai_conversations(id) on delete cascade, role text not null check (role in ('user','assistant')), content text not null, created_at timestamptz not null default now());

-- ===== Communication
create table public.conversations (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now());
create table public.conversation_members (conversation_id uuid references public.conversations(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (conversation_id, user_id));
create table public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid references public.conversations(id) on delete cascade, sender_id uuid not null references public.profiles(id) on delete cascade, body text not null, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, type text not null, title text, body text, data jsonb, read boolean not null default false, created_at timestamptz not null default now());

-- ===== Documents RH
create table public.document_templates (id uuid primary key default gen_random_uuid(), kind text not null, language lang_code not null default 'fr', body text not null);
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('work_contract','internship_contract','internship_agreement','attestation','certificate','letter','other')),
  title text, language lang_code not null default 'fr', file_url text, data jsonb,
  created_at timestamptz not null default now()
);

-- ===== Administration
create table public.reports (id uuid primary key default gen_random_uuid(), reporter_id uuid references public.profiles(id) on delete set null, entity text, entity_id uuid, reason text, status text default 'open', created_at timestamptz not null default now());
create table public.audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null, action text not null, entity text, entity_id uuid, meta jsonb, created_at timestamptz not null default now());
create table public.platform_settings (key text primary key, value jsonb not null);

-- ################ 2) RLS / STORAGE / REALTIME ################
-- HireLink — Row Level Security
create or replace function public.current_role_name() returns user_role language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_admin() returns boolean language sql stable as $$ select public.current_role_name() = 'admin' $$;
create or replace function public.is_company_member(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.company_members where company_id = cid and user_id = auth.uid()) $$;

do $$ declare t text; begin
  foreach t in array array['profiles','candidate_profiles','educations','experiences','certifications','companies','company_members','job_offers','applications',
    'application_status_history','interviews','recruitments','cv_analyses','matching_results','recommendations','ai_conversations','ai_messages','conversations',
    'conversation_members','messages','notifications','documents','document_templates','reports','audit_logs','platform_settings','skills']
  loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

-- profiles
create policy "profil: lecture soi/admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profil: maj soi" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- candidat
create policy "cand: propriétaire" on public.candidate_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cand: recruteurs voient les candidats ayant postulé" on public.candidate_profiles for select using (
  exists (select 1 from public.applications a join public.job_offers j on j.id = a.job_id
          where a.candidate_id = candidate_profiles.id and public.is_company_member(j.company_id)) or public.is_admin());
create policy "edu: propriétaire" on public.educations for all using (exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid()));
create policy "exp: propriétaire" on public.experiences for all using (exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid()));
create policy "cert: propriétaire" on public.certifications for all using (exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid()));

-- entreprises
create policy "ent: lecture vérifiées/membres/admin" on public.companies for select using (verification_status = 'verified' or public.is_company_member(id) or public.is_admin());
create policy "ent: création" on public.companies for insert with check (owner_id = auth.uid());
create policy "ent: maj membres/admin" on public.companies for update using (public.is_company_member(id) or public.is_admin());
create policy "membres: lecture" on public.company_members for select using (user_id = auth.uid() or public.is_company_member(company_id) or public.is_admin());

-- offres
create policy "offres: publiées visibles" on public.job_offers for select using (status = 'published' or public.is_company_member(company_id) or public.is_admin());
create policy "offres: membres écrivent" on public.job_offers for all using (public.is_company_member(company_id) or public.is_admin()) with check (public.is_company_member(company_id) or public.is_admin());

-- candidatures
create policy "cand-app: candidat voit/crée" on public.applications for select using (
  exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid())
  or exists (select 1 from public.job_offers j where j.id = job_id and public.is_company_member(j.company_id)) or public.is_admin());
create policy "cand-app: candidat crée" on public.applications for insert with check (exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid()));
create policy "cand-app: recruteur maj" on public.applications for update using (exists (select 1 from public.job_offers j where j.id = job_id and public.is_company_member(j.company_id)));
create policy "hist: lecture liée" on public.application_status_history for select using (exists (select 1 from public.applications a where a.id = application_id));
create policy "match: lecture liée" on public.matching_results for select using (
  exists (select 1 from public.job_offers j where j.id = job_id and public.is_company_member(j.company_id))
  or exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid()) or public.is_admin());

-- entretiens / recrutements
create policy "entretiens: candidat/recruteur" on public.interviews for select using (
  exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid())
  or created_by = auth.uid() or public.is_admin());
create policy "entretiens: recruteur écrit" on public.interviews for all using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "recrutements: créateur" on public.recruitments for all using (created_by = auth.uid() or public.is_admin());

-- IA, notifications, docs, messages
create policy "cv: propriétaire" on public.cv_analyses for all using (exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid()));
create policy "reco: propriétaire" on public.recommendations for select using (exists (select 1 from public.candidate_profiles c where c.id = candidate_id and c.user_id = auth.uid()));
create policy "ia-conv: propriétaire" on public.ai_conversations for all using (user_id = auth.uid());
create policy "ia-msg: propriétaire" on public.ai_messages for all using (exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "notif: propriétaire" on public.notifications for all using (user_id = auth.uid());
create policy "docs: propriétaire/admin" on public.documents for all using (owner_id = auth.uid() or public.is_admin());
create policy "tpl: lecture" on public.document_templates for select using (auth.role() = 'authenticated');
create policy "conv: membres" on public.conversations for select using (exists (select 1 from public.conversation_members m where m.conversation_id = id and m.user_id = auth.uid()));
create policy "conv-membres: soi" on public.conversation_members for select using (user_id = auth.uid());
create policy "msg: membres lisent" on public.messages for select using (exists (select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()));
create policy "msg: membres écrivent" on public.messages for insert with check (sender_id = auth.uid());
create policy "skills: lecture" on public.skills for select using (true);

-- admin
create policy "reports: créer" on public.reports for insert with check (reporter_id = auth.uid());
create policy "reports: admin" on public.reports for select using (public.is_admin());
create policy "audit: admin" on public.audit_logs for select using (public.is_admin());
create policy "settings: admin" on public.platform_settings for all using (public.is_admin());

-- Storage : buckets privés (cv, documents) + publics (avatars, logos) ; dossier = uid de l'utilisateur
insert into storage.buckets (id, name, public) values ('cvs','cvs',false),('documents','documents',false),('avatars','avatars',true),('logos','logos',true) on conflict do nothing;
create policy "storage: propriétaire cvs/documents" on storage.objects for all
  using (bucket_id in ('cvs','documents') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('cvs','documents') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage: lecture publique avatars/logos" on storage.objects for select using (bucket_id in ('avatars','logos'));
create policy "storage: écriture avatars/logos propriétaire" on storage.objects for insert
  with check (bucket_id in ('avatars','logos') and (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime
alter publication supabase_realtime add table public.notifications, public.messages;

-- ################ 3) SEED ################
insert into public.skills (name) values ('React'),('Node.js'),('Python'),('PostgreSQL'),('Docker'),('Kubernetes'),('Terraform'),('AWS'),('TypeScript') on conflict do nothing;
insert into public.platform_settings (key, value) values ('default_language','"fr"'),('ai_monthly_quota_tokens','100000000') on conflict do nothing;
