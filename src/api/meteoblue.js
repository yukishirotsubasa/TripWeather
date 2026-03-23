const FUNCTION_URL = import.meta.env.VITE_GCP_FUNCTION_URL;

/**
 * 從 Cloud Function Proxy 獲取 Meteoblue 數據
 */
export const fetchMeteoblue = async (lat, lng, date) => {
  const url = `${FUNCTION_URL}?source=meteoblue&lat=${lat}&lng=${lng}&date=${date}`;
  
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Meteoblue API 返回了非 JSON 格式的內容:', text.slice(0, 100));
      throw new Error(`Cloud Function 傳回了錯誤格式 (Meteoblue)`);
    }
    if (!response.ok) throw new Error('Meteoblue Proxy 請求失敗');
    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};
