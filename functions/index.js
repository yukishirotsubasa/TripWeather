const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const admin = require('firebase-admin');

// Initialize Firebase Admin (uses default credentials)
admin.initializeApp();
const db = admin.firestore();

const client = new SecretManagerServiceClient();
const fetch = require('node-fetch');

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

// Helper to normalize Meteoblue response
function normalizeMeteoblue(data) {
  if (!data || !data.data_day || !data.data_1h) {
    console.error('Meteoblue 原始資料格式不符:', JSON.stringify(data).slice(0, 500));
    throw new Error('Meteoblue API 回傳數據結構不完整 (缺少 data_day 或 data_1h)');
  }
  const day = data.data_day;
  const hour = data.data_1h;

  // 安全地獲取多種可能的欄位名
  const findVal = (obj, keys) => {
    for (const key of keys) {
      if (obj[key] !== undefined) return obj[key];
    }
    return undefined;
  };

  const getFirst = (obj, keys) => {
    const val = findVal(obj, keys);
    return Array.isArray(val) ? val[0] : val;
  };

  const tempMax = getFirst(day, ['tempmax', 'temperature_max', 'temp_max', 'temperature_2m_max']);
  const tempMin = getFirst(day, ['tempmin', 'temperature_min', 'temp_min', 'temperature_2m_min']);
  const precipProb = getFirst(day, ['precipitation_probability', 'precip_prob', 'precipitation_probability_max']);

  const hourlyTime = findVal(hour, ['time']) || [];
  const hourlyTemp = findVal(hour, ['temp', 'temperature', 'temperature_2m', 'temp_c']) || [];
  const hourlyPrecip = findVal(hour, ['precipitation_probability', 'precip_prob', 'chance_of_rain']) || [];

  return {
    source: 'meteoblue',
    daily: {
      tempMax: tempMax,
      tempMin: tempMin,
      precipProb: precipProb
    },
    hourly: {
      time: hourlyTime.map(t => typeof t === 'string' ? t.replace(' ', 'T') : t),
      temperature: hourlyTemp,
      precipitation: hourlyPrecip
    }
  };
}

/**
 * Cloud Function to Proxy Weather API Requests
 * Hides API Keys from the frontend and normalizes output
 */
exports.weatherProxy = async (req, res) => {
  const allowedOrigins = [
    'https://yukishirotsubasa.github.io'
  ];
  const origin = req.headers.origin || '*';

  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    // Default or public (if you want to allow it temporarily for testing)
    // res.set('Access-Control-Allow-Origin', '*'); 
  }
  res.set('Vary', 'Origin');

  res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
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
    } else if (source === 'meteoblue') {
      const cacheKey = `mb_${parseFloat(lat).toFixed(2)}_${parseFloat(lng).toFixed(2)}`;
      const cacheRef = db.collection('weather_cache').doc(cacheKey);

      // 1. Try Cache
      try {
        const doc = await cacheRef.get();
        if (doc.exists) {
          const cacheData = doc.data();
          const ageHours = (Date.now() - cacheData.updatedAt) / (1000 * 60 * 60);
          if (ageHours < 3) {
            console.log(`[Cache Hit] ${cacheKey} (Age: ${ageHours.toFixed(1)}h)`);
            res.status(200).json(normalizeMeteoblue(cacheData.raw));
            return;
          }
        }
      } catch (cacheErr) {
        console.error('Firestore cache read error:', cacheErr);
      }

      // 2. Cache Miss: Fetch API
      const [version] = await client.accessSecretVersion({
        name: 'projects/tripplanner-490708/secrets/meteoblue/versions/latest',
      });
      const apiKey = version.payload.data.toString();
      const url = `https://my.meteoblue.com/packages/basic-1h_basic-day?lat=${lat}&lon=${lng}&apikey=${apiKey}&asjson=true&forecast_days=7`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.error_message) {
        throw new Error(`Meteoblue API Error: ${data.error_message}`);
      }

      // 3. Save to Cache
      try {
        await cacheRef.set({
          raw: data,
          updatedAt: Date.now()
        });
      } catch (saveErr) {
        console.error('Firestore cache save error:', saveErr);
      }

      res.status(200).json(normalizeMeteoblue(data));
    } else {
      res.status(400).json({ error: 'Unsupported source' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
