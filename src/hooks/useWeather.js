import { useState } from 'react';
import { fetchOpenMeteo } from '../api/openMeteo';
import { fetchWeatherAPI } from '../api/weatherApi';
import { fetchMeteoblue } from '../api/meteoblue';

const SOURCES = [
  { id: 'open-meteo', name: 'Open-Meteo', fetcher: fetchOpenMeteo },
  { id: 'weatherapi', name: 'WeatherAPI', fetcher: fetchWeatherAPI },
  { id: 'meteoblue', name: 'Meteoblue', fetcher: fetchMeteoblue }
];

export const useWeather = (items) => {
  const [data, setData] = useState([]); // Array of { name, data: [{x, y}], id }
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    if (!items || items.length === 0) {
      setData([]);
      setTableData([]);
      return;
    }
    
    setLoading(true);
    const newChartData = SOURCES.map(s => ({ name: s.name, id: s.id, data: [] }));
    const newTableData = [];

    try {
      // 1. 預先計算區域與不重複的請求
      // 將座標四捨五入到小數點後 1 位 (約 11km)，減少冗餘請求
      const getRegionKey = (lat, lng) => `${parseFloat(lat).toFixed(1)}_${parseFloat(lng).toFixed(1)}`;
      
      const regionDataMap = {}; // { [sourceId]: { [regionKey]: data } }
      SOURCES.forEach(s => regionDataMap[s.id] = {});

      // 2. 收集所有不重複的「區域」
      const regions = [...new Set(items.map(item => getRegionKey(item.lat, item.lng)))];

      // 3. 遍歷每個區域發送請求
      for (const regionKey of regions) {
        const representativeItem = items.find(item => getRegionKey(item.lat, item.lng) === regionKey);
        const { lat, lng, date } = representativeItem;

        await Promise.all(SOURCES.map(async (source) => {
          // Date guard for Meteoblue (Limit: 7 days)
          if (source.id === 'meteoblue') {
            const today = new Date();
            const targetDate = new Date(date);
            const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
            if (diffDays > 7) return; 
          }

          const res = await source.fetcher(lat, lng, date);
          if (res) {
            regionDataMap[source.id][regionKey] = res;
          }
        }));
      }

      // 4. 將抓到的區域資料對應回每個景點
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const nextItem = items[i + 1];
        const regionKey = getRegionKey(item.lat, item.lng);
        
        const startTime = new Date(`${item.date} ${item.time || '00:00'}`).getTime();
        const endTime = nextItem 
          ? new Date(`${nextItem.date} ${nextItem.time || '00:00'}`).getTime()
          : new Date(`${item.date} 23:59:59`).getTime();

        const locationWeather = { id: item.id, location: item.location, date: item.date, time: item.time, sources: {} };

        SOURCES.forEach((source, sourceIdx) => {
          const res = regionDataMap[source.id][regionKey];
          if (res && res.hourly) {
            // 過濾出屬於該景點時段的每小時數據
            res.hourly.time.forEach((t, idx) => {
              const timeVal = new Date(t).getTime();
              if (timeVal >= startTime && timeVal < endTime) {
                newChartData[sourceIdx].data.push({ 
                   x: timeVal, 
                   y: res.hourly.temperature[idx] 
                });
              }
            });

            locationWeather.sources[source.id] = {
              tempMax: res.daily.tempMax,
              tempMin: res.daily.tempMin,
              precip: res.daily.precipProb
            };
          }
        });

        const primarySource = locationWeather.sources['open-meteo'] || Object.values(locationWeather.sources)[0];
        if (primarySource) {
          newTableData.push({ ...item, ...primarySource });
        }
      }
    } catch (err) {
      console.error('Weather sync failed:', err);
    }

    setData(newChartData);
    setTableData(newTableData);
    setLoading(false);
  };

  return { data, tableData, loading, refresh: fetchAll };
};
