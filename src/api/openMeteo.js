/**
 * Fetch weather from Open-Meteo
 * Handles both hourly and daily data
 */
export const fetchOpenMeteo = async (lat, lng, startDate, endDate) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Open-Meteo request failed');
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    return null;
  }
};
