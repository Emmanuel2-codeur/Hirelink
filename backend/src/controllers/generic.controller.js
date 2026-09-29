import { supabaseAdmin, requireDb } from '../lib/supabase.js';
import { HttpError, ok } from '../lib/http.js';

// CRUD minimal « mes lignes » pour une table avec colonne propriétaire.
export const ownedCrud = (table, ownerCol = 'user_id') => ({
  list: async (req, res) => {
    if (!requireDb(res)) return;
    const { data, error } = await supabaseAdmin.from(table).select('*').eq(ownerCol, req.user.id).order('created_at', { ascending: false });
    if (error) throw new HttpError(400, error.message);
    ok(res, data);
  },
  create: async (req, res) => {
    const { data, error } = await supabaseAdmin.from(table).insert({ ...req.body, [ownerCol]: req.user.id }).select().single();
    if (error) throw new HttpError(400, error.message);
    ok(res, data, 201);
  },
});
