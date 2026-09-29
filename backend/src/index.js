import { app } from './app.js';
import { env, supabaseConfigured } from './config/env.js';

app.listen(env.port, () => {
  console.log(`✔ HireLink API  → http://localhost:${env.port}/api  (docs: /api/docs)`);
  if (!supabaseConfigured) console.warn('⚠ Supabase non configuré : copiez .env.example vers backend/.env');
});
