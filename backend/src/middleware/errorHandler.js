export const errorHandler = (err, req, res, next) => {
<<<<<<< HEAD
  const status = Number.isInteger(err?.status) ? err.status : 500;
  const message = err?.message || 'Internal server error';

  console.error('[server-error]', err?.stack || err);
  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? (err?.stack || null) : undefined,
  });
=======
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
>>>>>>> janu-work
};
