<p align="center"><img src="web/public/logo.png" width="140" alt="HireLink" /></p>

# HireLink — Plateforme Web & Mobile intelligente de recrutement

Monorepo : `web/` (React) · `mobile/` (Expo) · `backend/` (Express) · `supabase/` (SQL + RLS) · `docs/`.

## Démarrage rapide (mode démo, sans Supabase)
```bash
npm install
npm run dev          # API :4000  +  Web :5173
```
Ouvrez http://localhost:5173 → **Se connecter** → choisissez un rôle (Candidat / Recruteur / Admin).
Le sélecteur FR / EN / العربية bascule aussi en RTL. Swagger : http://localhost:4000/api/docs

## Brancher Supabase (mode réel)
1. Créez un projet sur supabase.com.
2. SQL Editor : exécutez dans l'ordre `supabase/migrations/*.sql` puis `supabase/seed.sql`.
3. `cp .env.example backend/.env` et `cp web/.env.example web/.env` → renseignez les clés.
4. Pour créer un admin : inscrivez un compte puis `update profiles set role='admin' where id='<uuid>';`
5. IA : ajoutez `GEMINI_API_KEY` (ou `OPENAI_API_KEY`) dans `backend/.env`. Sans clé, l'assistant répond en mode démo.

## Mobile
```bash
cd mobile && cp .env.example .env && npm install && npx expo start
```
(Sur téléphone physique, remplacez `localhost` par l'IP de votre machine dans `EXPO_PUBLIC_API_URL`.)

## Stack
React · Tailwind · shadcn-style (Radix Slot + cva) · Lucide · Inter / Noto Sans Arabic · Recharts · Motion · React Hook Form + Zod · i18next · Express · Supabase (PG, Auth, Storage, Realtime) · Gemini/OpenAI.

## Documentation
`docs/architecture.md` · `docs/api.md` · `docs/planning.md`
