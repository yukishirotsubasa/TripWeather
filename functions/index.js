const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

/**
 * Cloud Function to Proxy Weather API Requests
 * Hides API Keys from the frontend
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
      // Fetch key from Secret Manager
      const [version] = await client.accessSecretVersion({
        name: 'projects/tripplanner-490708/secrets/weatherapi/versions/latest',
      });
      const apiKey = version.payload.data.toString();
      
      const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&dt=${date}`);
      const data = await response.json();
      res.status(200).json(data);
    } else {
      res.status(400).send('Unsupported source');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};
