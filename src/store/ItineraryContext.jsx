import React, { createContext, useContext, useState, useEffect } from 'react';
import { compressData, decompressData } from '../utils/sharing';

const ItineraryContext = createContext();

export const ItineraryProvider = ({ children }) => {
  const [itinerary, setItinerary] = useState({
    title: '我的旅遊行程',
    items: [],
    sources: ['open-meteo', 'weatherapi']
  });

  // Load from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      const data = decompressData(q);
      if (data) setItinerary(data);
    }
  }, []);

  const addItem = (item) => {
    if (itinerary.items.length >= 10) return;
    setItinerary(prev => ({
      ...prev,
      items: [...prev.items, { ...item, id: crypto.randomUUID() }]
    }));
  };

  const removeItem = (id) => {
    setItinerary(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));
  };

  const updateTitle = (title) => setItinerary(prev => ({ ...prev, title }));

  const rotateSource = (source) => {
    // Logic to toggle/highlight source could go here or in visual state
  };

  const shareUrl = () => {
    const q = compressData(itinerary);
    return `${window.location.origin}${window.location.pathname}?q=${q}`;
  };

  return (
    <ItineraryContext.Provider value={{ itinerary, addItem, removeItem, updateTitle, shareUrl }}>
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = () => useContext(ItineraryContext);
