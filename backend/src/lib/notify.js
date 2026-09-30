import { supabaseAdmin } from './supabase.js';
// Crée une notification (diffusée en temps réel via Supabase Realtime). Ne bloque jamais l'action principale.
export async function notify(userId, type, title, data = {}) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('notifications').insert({ user_id: userId, type, title, data });
  if (error) console.warn('notification non créée :', error.message);
}
