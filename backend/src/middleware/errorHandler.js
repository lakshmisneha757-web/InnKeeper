export const errorHandler = (err, req, res, next) => {
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const message = err?.message || 'Internal server error';

  console.error('[server-error]', err?.stack || err);
  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? (err?.stack || null) : undefined,
  });
};
