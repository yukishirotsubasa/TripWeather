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

  useEffect(() => {
    if (items.length === 0) return;

    const fetchAll = async () => {
      setLoading(true);
      const newChartData = [];
      const newTableData = [];

      try {
        const sourceSeries = { name: 'Open-Meteo', id: 'open-meteo', data: [] };
        
        for (const item of items) {
          const res = await fetchOpenMeteo(item.lat, item.lng, item.date, item.date);
          if (res && res.hourly) {
            // Merge hourly data
            res.hourly.time.forEach((t, i) => {
              sourceSeries.data.push({ 
                x: new Date(t).getTime(), 
                y: res.hourly.temperature_2m[i] 
              });
            });

            // Table Summary (First available daily data for each item)
            newTableData.push({
              location: item.location,
              date: item.date,
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

    fetchAll();
  }, [items]);

  return { data, tableData, loading };
};
