import React, { useState } from 'react';
import { ItineraryProvider, useItinerary } from './store/ItineraryContext';
import WeatherChart from './components/WeatherChart';
import WeatherTable from './components/WeatherTable';
import WeatherSourceSelector from './components/WeatherSourceSelector';
import { useWeather } from './hooks/useWeather';
import { Share2, Plus, Trash2, MapPin, Calendar } from 'lucide-react';

const MainApp = () => {
  const { itinerary, trips, activeIndex, setActiveIndex, addItem, removeItem, addTrip, deleteTrip, updateTrip, shareUrl } = useItinerary();
  const [activeSource, setActiveSource] = useState('open-meteo');
  const { data, tableData, loading, refresh } = useWeather(itinerary.items);

  const handleAddLocation = (e) => {
    e.preventDefault();
    const form = e.target;
    addItem({ 
      location: form.location.value, 
      date: form.date.value, 
      time: form.time.value,
      lat: 35.6762 + (Math.random() - 0.5),
      lng: 139.6503 + (Math.random() - 0.5)
    });
    form.reset();
  };

  const copyShareLink = () => {
    const url = shareUrl();
    if (!url) return alert('無法產生分享連結');
    navigator.clipboard.writeText(url);
    alert('分享連結已複製！');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem', width: '100%', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      {/* Sidebar - Trip Manager */}
      <aside style={{ flex: '1 1 250px', maxWidth: '300px' }}>
        <div className="glass card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>我的行程</h3>
            <button onClick={addTrip} style={{ padding: '0.4rem', borderRadius: '50%' }}><Plus size={16}/></button>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {trips.map((trip, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveIndex(idx)}
                style={{ 
                  padding: '0.75rem', borderRadius: '10px', cursor: 'pointer',
                  border: `1px solid ${idx === activeIndex ? 'var(--primary)' : 'transparent'}`,
                  background: idx === activeIndex ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.title}</span>
                {trips.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); deleteTrip(idx); }} style={{ padding: '2px', background: 'transparent' }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: '3 1 600px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <input 
              value={itinerary.title} 
              onChange={(e) => updateTrip({ title: e.target.value })}
              style={{ fontSize: '1.75rem', fontWeight: '800', background: 'transparent', border: 'none', padding: 0 }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>純前端旅遊氣象預報比對網</p>
          </div>
          <button onClick={copyShareLink} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={18} /> 分享
          </button>
        </header>

        <form onSubmit={handleAddLocation} className="glass card" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>地點</label>
            <input name="location" placeholder="行程景點..." required style={{ width: '100%' }} />
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>日期</label>
            <input name="date" type="date" required style={{ width: '100%' }} />
          </div>
          <div style={{ flex: '0 1 100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>時間</label>
            <input name="time" type="time" defaultValue="09:00" step="3600" required style={{ width: '100%' }} />
          </div>
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> 新增
          </button>
        </form>

        {itinerary.items.length > 0 && (
          <section className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>氣象趨勢</h2>
                <button 
                  onClick={refresh} 
                  disabled={loading}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white' }}
                >
                  {loading ? '更新中...' : '更新氣象資訊'}
                </button>
              </div>
            </div>
            <WeatherChart data={data} activeSource={activeSource} />
            <WeatherTable items={tableData} />
          </section>
        )}

        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>旅行清單 ({itinerary.items.length}/20)</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {itinerary.items.map(item => (
              <div key={item.id} className="glass card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5 }}>{item.time}</span>
                  <div>
                    <p style={{ fontWeight: 600 }}>{item.location}</p>
                    <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{item.date}</p>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', opacity: 0.4 }} className="hover-red">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
      
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
