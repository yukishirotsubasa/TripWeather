import React, { createContext, useContext, useState, useEffect } from 'react';
import { compressData, decompressData } from '../utils/sharing';

const ItineraryContext = createContext();

export const ItineraryProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    // Initial load from localStorage
    const saved = localStorage.getItem('tripweather_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Loding storage failed:', e);
      }
    }
    return {
      trips: [{ title: '未命名行程 1', items: [] }],
      activeIndex: 0
    };
  });

  const [previewTrip, setPreviewTrip] = useState(null);

  // Helper for default name
  const getDefaultName = () => {
    const now = new Date();
    return `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Share URL loading
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      const data = decompressData(q);
      if (data) {
        setPreviewTrip({ ...data, title: '預覽分享的行程' });
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('tripweather_data', JSON.stringify(state));
  }, [state]);

  const activeTrip = previewTrip || state.trips[state.activeIndex] || state.trips[0];

  const addItem = (item) => {
    if (previewTrip) return; // Cannot edit in preview
    if (activeTrip.items.length >= 20) return;
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
    
    const newTrips = [...state.trips];
    newTrips[state.activeIndex] = {
      ...activeTrip,
      items: [...activeTrip.items, { ...item, id }].sort((a, b) => 
        new Date(`${a.date} ${a.time || '00:00'}`) - new Date(`${b.date} ${b.time || '00:00'}`)
      )
    };
    setState(prev => ({ ...prev, trips: newTrips }));
  };

  const addTrip = () => {
    setState(prev => ({
      trips: [...prev.trips, { title: getDefaultName(), items: [] }],
      activeIndex: prev.trips.length
    }));
  };

  const savePreview = () => {
    if (!previewTrip) return;
    setState(prev => ({
      trips: [...prev.trips, { title: getDefaultName(), items: previewTrip.items }],
      activeIndex: prev.trips.length
    }));
    setPreviewTrip(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const removeItem = (id) => {
    const newTrips = [...state.trips];
    newTrips[state.activeIndex] = {
      ...activeTrip,
      items: activeTrip.items.filter(i => i.id !== id)
    };
    setState(prev => ({ ...prev, trips: newTrips }));
  };

  const deleteTrip = (index) => {
    if (state.trips.length <= 1) return;
    const newTrips = state.trips.filter((_, i) => i !== index);
    setState({
      trips: newTrips,
      activeIndex: Math.max(0, state.activeIndex - 1)
    });
  };

  const updateTrip = (updates) => {
    const newTrips = [...state.trips];
    newTrips[state.activeIndex] = { ...activeTrip, ...updates };
    setState(prev => ({ ...prev, trips: newTrips }));
  };

  const shareUrl = () => {
    // Only share items, not the user's custom title
    const q = compressData({ items: activeTrip.items });
    if (!q) return null;
    return `${window.location.origin}${window.location.pathname}?q=${q}`;
  };

  return (
    <ItineraryContext.Provider value={{ 
      itinerary: activeTrip, 
      trips: state.trips,
      activeIndex: state.activeIndex,
      isPreview: !!previewTrip,
      setActiveIndex: (index) => { setPreviewTrip(null); setState(prev => ({ ...prev, activeIndex: index })); },
      addItem, 
      removeItem, 
      addTrip,
      deleteTrip,
      savePreview,
      updateTrip, 
      shareUrl 
    }}>
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = () => useContext(ItineraryContext);
