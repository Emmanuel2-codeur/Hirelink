insert into public.skills (name) values ('React'),('Node.js'),('Python'),('PostgreSQL'),('Docker'),('Kubernetes'),('Terraform'),('AWS'),('TypeScript') on conflict do nothing;
insert into public.platform_settings (key, value) values ('default_language','"fr"'),('ai_monthly_quota_tokens','100000000') on conflict do nothing;
