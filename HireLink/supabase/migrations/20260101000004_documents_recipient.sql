-- HireLink — le candidat peut consulter les documents qui lui sont destinés
-- À exécuter UNE FOIS sur une base déjà créée (les nouvelles installations l'ont déjà).
alter table public.documents add column if not exists recipient_id uuid references public.profiles(id) on delete set null;
drop policy if exists "docs: destinataire lit" on public.documents;
create policy "docs: destinataire lit" on public.documents for select using (recipient_id = auth.uid());
