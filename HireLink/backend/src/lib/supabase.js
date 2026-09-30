import { createClient } from '@supabase/supabase-js';
import { env, supabaseConfigured } from '../config/env.js';

// Client admin (service role) : uniquement côté serveur, contourne la RLS.
export const supabaseAdmin = supabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } })
  : null;

export const requireDb = (res) => {
  if (!supabaseAdmin) {
    res.status(503).json({ error: { code: 'DB_NOT_CONFIGURED', message: 'Supabase non configuré (voir .env)' } });
    return false;
  }
  return true;
};
