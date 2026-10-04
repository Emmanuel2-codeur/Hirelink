export const notFound = (req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} introuvable` } });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (status >= 500 && status !== 503) console.error(err); // 503 = service non configuré : pas de trace bruyante
  res.status(status).json({ error: { code: err.code || 'INTERNAL_ERROR', message: err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop volumineux (5 Mo max)' : err.message || 'Erreur interne' } });
};
