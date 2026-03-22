import React from 'react';

const WeatherTable = ({ items }) => {
  return (
    <div className="glass card animate-fade" style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.75rem' }}>地點</th>
            <th style={{ padding: '0.75rem' }}>日期</th>
            <th style={{ padding: '0.75rem' }}>最高溫</th>
            <th style={{ padding: '0.75rem' }}>最低溫</th>
            <th style={{ padding: '0.75rem' }}>降水率</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}>{item.location}</td>
              <td style={{ padding: '0.75rem' }}>{item.date}</td>
              <td style={{ padding: '0.75rem' }}>{item.tempMax}°C</td>
              <td style={{ padding: '0.75rem' }}>{item.tempMin}°C</td>
              <td style={{ padding: '0.75rem' }}>{item.precip}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeatherTable;
