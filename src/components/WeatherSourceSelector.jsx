import React from 'react';

const WeatherSourceSelector = ({ sources, activeSource, onSelect }) => {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
      {sources.map(source => (
        <button
          key={source.id}
          onClick={() => onSelect(source.id)}
          style={{
            background: activeSource === source.id ? 'var(--primary)' : 'var(--bg-card)',
            color: activeSource === source.id ? 'white' : 'var(--text-muted)',
            border: `1px solid ${activeSource === source.id ? 'var(--primary)' : 'var(--border)'}`,
            padding: '0.5rem 1rem',
            whiteSpace: 'nowrap'
          }}
        >
          {source.label}
        </button>
      ))}
    </div>
  );
};

export default WeatherSourceSelector;
