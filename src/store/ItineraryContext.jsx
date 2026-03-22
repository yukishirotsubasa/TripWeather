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

  // Share URL loading (overrides local storage if present)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      const data = decompressData(q);
      if (data) {
        setState(prev => ({
          trips: [...prev.trips, { ...data, title: `分享的行程 ${new Date().toLocaleDateString()}` }],
          activeIndex: prev.trips.length
        }));
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('tripweather_data', JSON.stringify(state));
  }, [state]);

  const activeTrip = state.trips[state.activeIndex] || state.trips[0];

  const addItem = (item) => {
    if (activeTrip.items.length >= 20) return; // Up limit
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

  const removeItem = (id) => {
    const newTrips = [...state.trips];
    newTrips[state.activeIndex] = {
      ...activeTrip,
      items: activeTrip.items.filter(i => i.id !== id)
    };
    setState(prev => ({ ...prev, trips: newTrips }));
  };

  const addTrip = () => {
    setState(prev => ({
      trips: [...prev.trips, { title: `未命名行程 ${prev.trips.length + 1}`, items: [] }],
      activeIndex: prev.trips.length
    }));
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
    const q = compressData(activeTrip);
    if (!q) return null;
    return `${window.location.origin}${window.location.pathname}?q=${q}`;
  };

  return (
    <ItineraryContext.Provider value={{ 
      itinerary: activeTrip, 
      trips: state.trips,
      activeIndex: state.activeIndex,
      setActiveIndex: (index) => setState(prev => ({ ...prev, activeIndex: index })),
      addItem, 
      removeItem, 
      addTrip,
      deleteTrip,
      updateTrip, 
      shareUrl 
    }}>
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = () => useContext(ItineraryContext);
