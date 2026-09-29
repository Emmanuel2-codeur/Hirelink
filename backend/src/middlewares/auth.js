import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, asyncHandler } from '../lib/http.js';

// Vérifie le JWT Supabase et charge le rôle depuis public.profiles.
export const authenticate = asyncHandler(async (req, _res, next) => {
  if (!supabaseAdmin) throw new HttpError(503, 'Supabase non configuré', 'DB_NOT_CONFIGURED');
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!token) throw new HttpError(401, 'Token manquant', 'UNAUTHENTICATED');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Token invalide', 'UNAUTHENTICATED');
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id, role, language, full_name').eq('id', data.user.id).single();
  req.user = { id: data.user.id, email: data.user.email, role: profile?.role || 'candidate', language: profile?.language || 'fr' };
  next();
});

// RBAC
export const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new HttpError(403, 'Accès refusé', 'FORBIDDEN'));
