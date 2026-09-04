export async function getWeather(req, res) {
  res.status(410).json({
    error: 'Weather service is no longer supported',
  });
}
