import { useState, useEffect } from 'react';
import { fetchOpenMeteo } from '../api/openMeteo';

// Mock WeatherAPI for now (until Cloud Function is ready)
const fetchWeatherAPIMock = async (lat, lng, date) => {
  return {
    daily: {
      temperature_2m_max: [Math.random() * 5 + 20],
      temperature_2m_min: [Math.random() * 5 + 15],
      precipitation_probability_max: [Math.floor(Math.random() * 40)]
    },
    hourly: {
      time: Array.from({length: 24}, (_, i) => `${date}T${String(i).padStart(2, '0')}:00`),
      temperature_2m: Array.from({length: 24}, () => Math.random() * 10 + 15)
    }
  };
};

export const useWeather = (items) => {
  const [data, setData] = useState([]); // { name, data: [{x, y}] }
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    if (!items || items.length === 0) {
      setData([]);
      setTableData([]);
      return;
    }
    
    setLoading(true);
    const newChartData = [];
    const newTableData = [];

    try {
      const sourceSeries = { name: 'Open-Meteo', id: 'open-meteo', data: [] };
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const nextItem = items[i + 1];
        
        const res = await fetchOpenMeteo(item.lat, item.lng, item.date, item.date);
        if (res && res.hourly) {
          const startTime = new Date(`${item.date} ${item.time || '00:00'}`).getTime();
          const endTime = nextItem 
            ? new Date(`${nextItem.date} ${nextItem.time || '00:00'}`).getTime()
            : new Date(`${item.date} 23:59:59`).getTime();

          // Merge hourly data within interval
          res.hourly.time.forEach((t, idx) => {
            const timeVal = new Date(t).getTime();
            if (timeVal >= startTime && timeVal < endTime) {
              sourceSeries.data.push({ 
                x: timeVal, 
                y: res.hourly.temperature_2m[idx] 
              });
            }
          });

          // Table summary per location
          newTableData.push({
            id: item.id,
            location: item.location,
            date: item.date,
            time: item.time,
            tempMax: res.daily.temperature_2m_max[0],
            tempMin: res.daily.temperature_2m_min[0],
            precip: res.daily.precipitation_probability_max[0]
          });
        }
      }
      newChartData.push(sourceSeries);
    } catch (err) {
      console.error('Weather sync failed:', err);
    }

    setData(newChartData);
    setTableData(newTableData);
    setLoading(false);
  };

  // Load whenever items change (especially on sharing mount)
  useEffect(() => {
    if (items && items.length > 0) {
      fetchAll();
    }
  }, [items]); 

  return { data, tableData, loading, refresh: fetchAll };
};
