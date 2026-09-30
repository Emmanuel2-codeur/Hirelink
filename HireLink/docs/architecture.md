# Architecture HireLink

```
 Web (React/Vite) ─┐                      ┌─ Supabase Auth  (comptes, sessions, JWT)
                   ├─► API Express /api ──┼─ PostgreSQL + RLS (données métier)
 Mobile (Expo)  ───┘   (RBAC, matching,   ├─ Storage (cvs, documents, avatars, logos)
        │                IA, documents)   └─ Realtime (notifications, messages)
        └─► Supabase direct (auth, realtime)          │
                                                      └─► Gemini / OpenAI
```

## Principes
- **Séparation** : interfaces (web/mobile) ↔ logique métier (backend/) ↔ données (supabase/).
- **Sécurité** : JWT Supabase vérifié par le backend, RBAC par rôle (`candidate | recruiter | company | admin`), **RLS** sur toutes les tables, buckets privés pour CV/documents.
- **Langue** : `profiles.language` = source de vérité ; l'UI **et** l'assistant IA la suivent (`/api/ai/chat` lit la langue du profil). Persistée en `localStorage` + profil.
- **RTL** : `document.dir` bascule automatiquement avec l'arabe ; classes Tailwind logiques (`ms-`, `me-`, `ps-`, `start-`).
- **IA = assistance** : les scores sont indicatifs ; la décision finale reste humaine (AI Act).

## Matching (backend/src/services/matching.service.js)
Compétences 60 % (indispensables 80 % / souhaitables 20 %) · expérience 25 % · localisation 15 %.

## Points d'extension
| Sujet | Où |
|---|---|
| Parsing PDF de CV + LLM | `ai.service.js#analyzeCvText` + route `/ai/analyze-cv` |
| Génération PDF des documents RH | à créer : `services/documents.service.js` + `/api/documents/generate` |
| Messagerie temps réel | table `messages` déjà publiée sur Realtime |
| Tests | Postman + Vitest/Supertest (semaine 7) |
