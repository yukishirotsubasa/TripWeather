const FUNCTION_URL = import.meta.env.VITE_GCP_FUNCTION_URL;

/**
 * 從 Cloud Function Proxy 獲取 Open-Meteo 數據 (標準化)
 */
export const fetchOpenMeteo = async (lat, lng, date) => {
  const url = `${FUNCTION_URL}?source=open-meteo&lat=${lat}&lng=${lng}&date=${date}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Open-Meteo Proxy 請求失敗');
    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};
