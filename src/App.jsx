import React, { useState } from 'react';
import { useItinerary } from './store/ItineraryContext';
import WeatherChart from './components/WeatherChart';
import WeatherTable from './components/WeatherTable';
import WeatherSourceSelector from './components/WeatherSourceSelector';
import { useWeather } from './hooks/useWeather';
import { Share2, Plus, Trash2, MapPin, Calendar } from 'lucide-react';

const MainApp = () => {
  const { itinerary, addItem, removeItem, shareUrl } = useItinerary();
  const [activeSource, setActiveSource] = useState('open-meteo');
  const { data, tableData, loading } = useWeather(itinerary.items);

  const handleAddLocation = (e) => {
    e.preventDefault();
    const form = e.target;
    const location = form.location.value;
    const date = form.date.value;
    // Mock coordinates for demo
    const lat = 35.6762 + (Math.random() - 0.5);
    const lng = 139.6503 + (Math.random() - 0.5);

    addItem({ location, date, lat, lng });
    form.reset();
  };

  const copyShareLink = () => {
    const url = shareUrl();
    navigator.clipboard.writeText(url);
    alert('分享連結已複製！');
  };

  const sources = [
    { id: 'open-meteo', label: 'Open-Meteo (專業)' },
    { id: 'weatherapi', label: 'WeatherAPI (商業)' }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem', width: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', background: 'linear-gradient(to right, #6366f1, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TripWeather</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>純前端旅遊氣象預報比對網</p>
        </div>
        <button onClick={copyShareLink} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Share2 size={18} /> 分享行程
        </button>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleAddLocation} className="glass card" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>地點</label>
            <input name="location" placeholder="搜尋地點..." required style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>日期</label>
            <input name="date" type="date" required style={{ width: '100%' }} />
          </div>
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> 新增
          </button>
        </form>
      </section>

      {itinerary.items.length > 0 && (
        <section className="animate-fade">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>趨勢預報</h2>
            {loading && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>載入中...</span>}
          </div>
          <WeatherSourceSelector
            sources={sources}
            activeSource={activeSource}
            onSelect={setActiveSource}
          />
          <WeatherChart data={data} activeSource={activeSource} />
          <WeatherTable items={tableData} />
        </section>
      )}

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>景點清單 ({itinerary.items.length}/10)</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {itinerary.items.map(item => (
            <div key={item.id} className="glass card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)' }}>
                   <MapPin size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 600 }}>{item.location}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} /> {item.date}
                  </p>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '0.5rem' }} className="hover-red">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {itinerary.items.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: '16px' }}>
              尚未新增行程，請從上方表單開始。
            </div>
          )}
        </div>
      </section>
      
      <style>{`
        .hover-red:hover { color: var(--accent) !important; }
      `}</style>
    </div>
  );
};

const App = () => (
  <ItineraryProvider>
    <MainApp />
  </ItineraryProvider>
);

export default App;
