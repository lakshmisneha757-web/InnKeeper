export const getLogs = async (req, res) => {
  res.status(410).json({
    error: 'Logs controller is no longer supported',
  });
};
