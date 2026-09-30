-- HireLink — suppression de compte sans blocage
-- À exécuter UNE FOIS sur une base déjà créée (les nouvelles installations l'ont déjà dans le schéma).
-- Les liens « créé par / modifié par » passent à NULL ; les messages d'un compte supprimé sont supprimés avec lui.
do $$
declare r record;
begin
  for r in select * from (values
    ('job_offers','created_by','set null'), ('application_status_history','changed_by','set null'),
    ('interviews','created_by','set null'), ('recruitments','created_by','set null'),
    ('reports','reporter_id','set null'), ('audit_logs','actor_id','set null'), ('messages','sender_id','cascade')
  ) as t(tbl, col, act)
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.tbl, r.tbl || '_' || r.col || '_fkey');
    execute format('alter table public.%I add constraint %I foreign key (%I) references public.profiles(id) on delete %s',
                   r.tbl, r.tbl || '_' || r.col || '_fkey', r.col, r.act);
  end loop;
end $$;
