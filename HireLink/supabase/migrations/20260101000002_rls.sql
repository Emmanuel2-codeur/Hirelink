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
create policy "docs: destinataire lit" on public.documents for select using (recipient_id = auth.uid());
create policy "tpl: lecture" on public.document_templates for select using (auth.role() = 'authenticated');
create policy "conv: membres" on public.conversations for select using (exists (select 1 from public.conversation_members m where m.conversation_id = id and m.user_id = auth.uid()));
create policy "conv-membres: soi" on public.conversation_members for select using (user_id = auth.uid());
create policy "msg: membres lisent" on public.messages for select using (exists (select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()));
create policy "msg: membres écrivent" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()));
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
