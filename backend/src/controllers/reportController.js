export const getReports = async (req, res) => {
  res.status(410).json({
    error: 'Reports controller is no longer supported',
  });
};