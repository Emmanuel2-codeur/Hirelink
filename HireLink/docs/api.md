# API REST — `/api` (Swagger : http://localhost:4000/api/docs)
Format : succès `{ data, meta? }` · erreur `{ error: { code, message } }` · Auth : `Authorization: Bearer <JWT Supabase>`

| Domaine | Endpoints | Rôles |
|---|---|---|
| health | `GET /health` | public |
| auth/users | `GET /auth/me`, `GET/PATCH /users/me` | connecté |
| candidates | `GET/PUT /candidates/me` | candidate |
| jobs | `GET /jobs`, `GET /jobs/:id` (public) · `POST /jobs`, `PATCH /jobs/:id`, `PATCH /jobs/:id/status` | recruteur/company/admin |
| applications | `POST /applications`, `GET /applications/mine` (candidate) · `GET /applications/job/:jobId`, `PATCH /applications/:id/status` (recruteur) | — |
| interviews / recruitments / documents / messages | `GET`, `POST` (CRUD de base) | connecté |
| companies / recruiters | `GET /companies/mine`, `POST /companies`, `GET /recruiters/me` | recruteur |
| conversations | `GET /conversations`, `POST /conversations {application_id}`, `GET/POST /conversations/:id/messages`, `PATCH /conversations/:id/read` | participants de la candidature |
| notifications | `GET /notifications`, `PATCH /notifications/:id/read` | connecté |
| ai | `POST /ai/chat`, `POST /ai/analyze-cv` | connecté |
| admin | `GET /admin/stats`, `GET /admin/companies/pending`, `PATCH /admin/companies/:id`, `GET /admin/audit-logs` | admin |
