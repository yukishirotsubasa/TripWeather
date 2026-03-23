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
      // Loop through each location in the itinerary
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const nextItem = items[i + 1];
        
        const startTime = new Date(`${item.date} ${item.time || '00:00'}`).getTime();
        const endTime = nextItem 
          ? new Date(`${nextItem.date} ${nextItem.time || '00:00'}`).getTime()
          : new Date(`${item.date} 23:59:59`).getTime();

        const locationWeather = { id: item.id, location: item.location, date: item.date, time: item.time, sources: {} };

        // Fetch from all sources for comparison
        await Promise.all(SOURCES.map(async (source, sourceIdx) => {
          const res = await source.fetcher(item.lat, item.lng, item.date);
          
          if (res && res.hourly) {
            // Add hourly data to chart series
            res.hourly.time.forEach((t, idx) => {
              const timeVal = new Date(t).getTime();
              if (timeVal >= startTime && timeVal < endTime) {
                newChartData[sourceIdx].data.push({ 
                  x: timeVal, 
                  y: res.hourly.temperature[idx] 
                });
              }
            });

            // Store summary for table (we'll use the primary source or first available for the main table view)
            locationWeather.sources[source.id] = {
              tempMax: res.daily.tempMax,
              tempMin: res.daily.tempMin,
              precip: res.daily.precipProb
            };
          }
        }));

        // Use 'open-meteo' as default for table display if available, else first source
        const primarySource = locationWeather.sources['open-meteo'] || Object.values(locationWeather.sources)[0];
        if (primarySource) {
          newTableData.push({
            ...item,
            ...primarySource
          });
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
