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
      const sources = [
        { id: 'open-meteo', label: 'Open-Meteo', fetcher: fetchOpenMeteo },
        { id: 'weatherapi', label: 'WeatherAPI', fetcher: fetchWeatherAPIMock }
      ];

      const newChartData = [];
      const newTableData = [];

      for (const source of sources) {
        let sourceSeries = { name: source.label, id: source.id, data: [] };
        
        for (const item of items) {
          const res = await source.fetcher(item.lat, item.lng, item.date, item.date);
          if (res) {
            // Chart Data (Hourly)
            if (res.hourly) {
              res.hourly.time.forEach((t, i) => {
                sourceSeries.data.push({ x: new Date(t).getTime(), y: res.hourly.temperature_2m[i] });
              });
            }

            // Table Data (Source 1 as primary for table)
            if (source.id === 'open-meteo') {
               newTableData.push({
                 location: item.location,
                 date: item.date,
                 tempMax: res.daily.temperature_2m_max[0],
                 tempMin: res.daily.temperature_2m_min[0],
                 precip: res.daily.precipitation_probability_max[0]
               });
            }
          }
        }
        newChartData.push(sourceSeries);
      }

      setData(newChartData);
      setTableData(newTableData);
      setLoading(false);
    };

    fetchAll();
  }, [items]);

  return { data, tableData, loading };
};
