const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

// Helper to normalize Open-Meteo response
function normalizeOpenMeteo(data) {
  return {
    source: 'open-meteo',
    daily: {
      tempMax: data.daily.temperature_2m_max[0],
      tempMin: data.daily.temperature_2m_min[0],
      precipProb: data.daily.precipitation_probability_max[0]
    },
    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m,
      precipitation: data.hourly.precipitation_probability || data.hourly.precipitation || []
    }
  };
}

// Helper to normalize WeatherAPI response
function normalizeWeatherAPI(data) {
  const day = data.forecast.forecastday[0];
  return {
    source: 'weatherapi',
    daily: {
      tempMax: day.day.maxtemp_c,
      tempMin: day.day.mintemp_c,
      precipProb: day.day.daily_chance_of_rain
    },
    hourly: {
      time: day.hour.map(h => h.time.replace(' ', 'T') + ':00'), // Format as ISO
      temperature: day.hour.map(h => h.temp_c),
      precipitation: day.hour.map(h => h.chance_of_rain)
    }
  };
}

/**
 * Cloud Function to Proxy Weather API Requests
 * Hides API Keys from the frontend and normalizes output
 */
exports.weatherProxy = async (req, res) => {
  // CORS Headers
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  const { source, lat, lng, date } = req.query;

  try {
    if (source === 'weatherapi') {
      const [version] = await client.accessSecretVersion({
        name: 'projects/tripplanner-490708/secrets/weatherapi/versions/latest',
      });
      const apiKey = version.payload.data.toString();
      
      const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&dt=${date}`);
      const data = await response.json();
      res.status(200).json(normalizeWeatherAPI(data));
    } else if (source === 'open-meteo') {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&start_date=${date}&end_date=${date}&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      const response = await fetch(url);
      const data = await response.json();
      res.status(200).json(normalizeOpenMeteo(data));
    } else {
      res.status(400).send('Unsupported source');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};
