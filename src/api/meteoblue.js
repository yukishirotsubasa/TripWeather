const FUNCTION_URL = import.meta.env.VITE_GCP_FUNCTION_URL;

/**
 * 從 Cloud Function Proxy 獲取 Meteoblue 數據
 */
export const fetchMeteoblue = async (lat, lng, date) => {
  const url = `${FUNCTION_URL}?source=meteoblue&lat=${lat}&lng=${lng}&date=${date}`;
  
  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    if (!response.ok) {
      if (isJson) {
        const errData = await response.json();
        console.error('Meteoblue Proxy 請求失敗:', errData.message || errData.error);
        throw new Error(`Meteoblue Proxy 錯誤: ${errData.message || errData.error}`);
      } else {
        const text = await response.text();
        console.error('Meteoblue Proxy 返回了非 JSON 錯誤:', text.slice(0, 100));
        throw new Error(`Meteoblue Proxy 請求失敗 (非 JSON)`);
      }
    }
    
    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
};
