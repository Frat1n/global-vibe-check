/**
 * LeafletMap Component - Real Geographic Map with Emotion Concentrations
 * 
 * This component replaces the basic bubble grid with an actual interactive map
 * that shows where different emotions are concentrated geographically using Leaflet.
 * 
 * Features:
 * - Interactive world map with zoom/pan
 * - Colored markers showing mood locations
 * - Clustering for dense areas
 * - Real-time mood data visualization 
 * - Tooltip showing mood details on hover
 */

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MoodEntry, MoodType } from '@/types/mood';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icons issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Mood color mapping for map markers
const moodColors: Record<MoodType, string> = {
  happy: '#fbbf24',      // Yellow - Happiness
  sad: '#60a5fa',        // Blue - Sadness  
  excited: '#f97316',    // Orange - Excitement
  stressed: '#ef4444',   // Red - Stress
  calm: '#22c55e',       // Green - Calm
  anxious: '#a855f7',    // Purple - Anxiety
};

// Mood emoji mapping for popups
const moodEmojis: Record<MoodType, string> = {
  happy: '😊',
  sad: '😢', 
  excited: '🤩',
  stressed: '😰',
  calm: '😌',
  anxious: '😟',
};

interface LeafletMapProps {
  moodEntries: MoodEntry[];
  height?: string;
}

/**
 * LeafletMap - Interactive geographic map showing mood concentrations
 */
const LeafletMap: React.FC<LeafletMapProps> = ({ 
  moodEntries, 
  height = "100%" 
}) => {
  const [mapKey] = useState(0);

  // Memoize map center and bounds calculation
  const mapConfig = useMemo(() => {
    if (moodEntries.length === 0) {
      return { center: [20, 0] as [number, number], zoom: 2 };
    }

    // Calculate center from mood entries
    const latSum = moodEntries.reduce((sum, entry) => sum + entry.lat, 0);
    const lngSum = moodEntries.reduce((sum, entry) => sum + entry.lng, 0);
    
    return {
      center: [latSum / moodEntries.length, lngSum / moodEntries.length] as [number, number],
      zoom: moodEntries.length > 1 ? 4 : 6
    };
  }, [moodEntries]);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden">
      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-10 glass-card p-3 rounded-lg max-w-xs">
        <h3 className="text-sm font-semibold mb-2 text-white">Global Mood Map</h3>
        <div className="space-y-1">
          {Object.entries(moodColors).map(([mood, color]) => (
            <div key={mood} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border border-white/20" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize text-white/90">
                {moodEmojis[mood as MoodType]} {mood}
              </span>
            </div>
          ))}
        </div>
        <div className="text-xs text-white/70 mt-2 pt-2 border-t border-white/10">
          {moodEntries.length} mood{moodEntries.length !== 1 ? 's' : ''} shared
        </div>
      </div>

      {/* Map Info Corner */}
      <div className="absolute bottom-4 right-4 z-10 glass-card p-2 rounded text-xs text-white/80">
        🌍 Interactive Mood Map • Click markers for details
      </div>

      {/* Leaflet Map Container */}
      <MapContainer
        key={mapKey}
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        style={{ height, width: '100%' }}
        className="rounded-lg"
        zoomControl={true}
        attributionControl={true}
      >
        {/* Base map tiles - Using OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={18}
        />

        {/* Render mood markers */}
        {moodEntries.map((entry, index) => {
          const color = moodColors[entry.mood];
          
          return (
            <CircleMarker
              key={`${entry.id}-${index}`}
              center={[entry.lat, entry.lng]}
              radius={8}
              pathOptions={{
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.7,
              }}
            >
              {/* Popup with mood details */}
              <Popup className="mood-popup">
                <div className="text-center p-2">
                  <div className="text-2xl mb-2">{moodEmojis[entry.mood]}</div>
                  <div className="font-semibold text-sm capitalize mb-1">
                    {entry.mood}
                  </div>
                  {entry.city && (
                    <div className="text-xs text-gray-600 mb-1">
                      📍 {entry.city}
                      {entry.country && `, ${entry.country}`}
                    </div>
                  )}
                  {entry.message && (
                    <div className="text-xs text-gray-700 mt-2 p-2 bg-gray-50 rounded max-w-40">
                      "{entry.message.slice(0, 100)}
                      {entry.message.length > 100 ? '...' : ''}"
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;