-- HireLink — messagerie : une conversation par candidature
-- À exécuter UNE FOIS sur une base déjà créée (les nouvelles installations l'ont déjà dans le schéma).
alter table public.conversations add column if not exists application_id uuid references public.applications(id) on delete cascade;
alter table public.conversations add column if not exists last_message_at timestamptz;
create unique index if not exists conversations_application_uidx on public.conversations(application_id);
alter table public.conversation_members add column if not exists last_read_at timestamptz not null default now();
create index if not exists messages_conv_created_idx on public.messages(conversation_id, created_at);

-- Écrire un message : seulement dans une conversation dont on est membre
drop policy if exists "msg: membres écrivent" on public.messages;
create policy "msg: membres écrivent" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.conversation_members m where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()));

-- Temps réel (ignorer l'erreur « already member » si déjà activé)
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
