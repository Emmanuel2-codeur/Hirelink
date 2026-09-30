import { HttpError } from '../lib/http.js';
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const r = schema.safeParse(req[source]);
  if (!r.success) return next(new HttpError(422, JSON.stringify(r.error.flatten().fieldErrors), 'VALIDATION_ERROR'));
  req[source] = r.data; next();
};
