import React from 'react';
import Chart from 'react-apexcharts';

const WeatherChart = ({ data, activeSource }) => {
  // data: array of { name: 'source', data: [{ x: date, y: temp }] }
  
  const options = {
    chart: {
      id: 'weather-chart',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: 'smooth',
      width: data.map(s => s.name === activeSource ? 4 : 1.5)
    },
    theme: { mode: 'dark' },
    xaxis: { type: 'datetime' },
    colors: ['#6366f1', '#10b981', '#f43f5e'],
    tooltip: { x: { format: 'dd MMM HH:mm' } },
    grid: { borderColor: '#334155' }
  };

  return (
    <div className="glass card animate-fade">
      <Chart options={options} series={data} type="line" height={350} />
    </div>
  );
};

export default WeatherChart;
