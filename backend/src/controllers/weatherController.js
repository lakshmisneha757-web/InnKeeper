export async function getWeather(req, res) {
  // Static mock weather data — replace with real API key if needed
  res.json({
    city: 'Local',
    temperature: 28,
    feelsLike: 30,
    humidity: 65,
    windSpeed: 12,
    condition: 'Partly Cloudy',
    icon: '⛅',
    forecast: [
      { day: 'Mon', high: 30, low: 22, condition: 'Sunny', icon: '☀️' },
      { day: 'Tue', high: 28, low: 21, condition: 'Partly Cloudy', icon: '⛅' },
      { day: 'Wed', high: 25, low: 19, condition: 'Rainy', icon: '🌧️' },
      { day: 'Thu', high: 27, low: 20, condition: 'Cloudy', icon: '☁️' },
      { day: 'Fri', high: 31, low: 23, condition: 'Sunny', icon: '☀️' },
    ]
  });
}
