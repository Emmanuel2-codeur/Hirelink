export class HttpError extends Error {
  constructor(status, message, code = 'ERROR') { super(message); this.status = status; this.code = code; }
}
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const ok = (res, data, status = 200) => res.status(status).json({ data });
