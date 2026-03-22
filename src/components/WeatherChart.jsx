import React from 'react';
import Chart from 'react-apexcharts';

const WeatherChart = ({ data, activeSource }) => {
  // data: array of { name: 'source', data: [{ x: date, y: temp }] }
  const hasData = data && data.length > 0 && data.some(s => s.data && s.data.length > 0);

  if (!hasData) {
    return (
      <div className="glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        正在讀取氣象趨勢圖...
      </div>
    );
  }
  
  const options = {
    chart: { type: 'line', toolbar: { show: false }, background: 'transparent', zoom: { enabled: false } },
    theme: { mode: 'dark' },
    stroke: { curve: 'smooth', width: data.map(s => s.name === activeSource ? 4 : 1.5) },
    xaxis: { 
      type: 'datetime',
      labels: { datetimeUTC: false, format: 'MM/dd HH:mm' }
    },
    yaxis: { title: { text: '溫度 (°C)' } },
    tooltip: { x: { format: 'yyyy/MM/dd HH:mm' } },
    colors: ['#6366f1', '#10b981', '#f43f5e'],
    grid: { borderColor: '#334155' }
  };

  return (
    <div className="glass" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
      <Chart options={options} series={data} type="line" height={350} />
    </div>
  );
};

export default WeatherChart;
