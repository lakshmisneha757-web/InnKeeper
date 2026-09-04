export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || (Number.isInteger(err?.status) ? err.status : 500);
  const message = err?.message || (status === 500 ? 'Internal server error' : 'An error occurred');

  console.error('[server-error]', err?.stack || err);
  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? (err?.stack || null) : undefined,
  });
};
