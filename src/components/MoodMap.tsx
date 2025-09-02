
import React, { useEffect, useRef } from 'react';
import { MoodEntry, MoodType } from '@/types/mood';

// Mock data for demonstration
const mockMoodData: MoodEntry[] = [
  { id: '1', mood: 'happy', lat: 40.7128, lng: -74.0060, timestamp: new Date(), city: 'New York' },
  { id: '2', mood: 'calm', lat: 51.5074, lng: -0.1278, timestamp: new Date(), city: 'London' },
  { id: '3', mood: 'excited', lat: 35.6762, lng: 139.6503, timestamp: new Date(), city: 'Tokyo' },
  { id: '4', mood: 'sad', lat: -33.8688, lng: 151.2093, timestamp: new Date(), city: 'Sydney' },
  { id: '5', mood: 'stressed', lat: 34.0522, lng: -118.2437, timestamp: new Date(), city: 'Los Angeles' },
];

const moodColors: Record<MoodType, string> = {
  happy: '#fbbf24',
  sad: '#60a5fa',
  excited: '#f97316',
  stressed: '#ef4444',
  calm: '#22c55e',
  anxious: '#a855f7',
};

interface MoodMapProps {
  moodEntries: MoodEntry[];
}

const MoodMap = ({ moodEntries }: MoodMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // For MVP, we'll use a simple SVG world map visualization
    // In production, this would be replaced with an actual map library like Leaflet or Mapbox
    
    const allEntries = [...mockMoodData, ...moodEntries];
    
    // Create a simple grid-based mood visualization
    const moodGrid = document.createElement('div');
    moodGrid.className = 'grid grid-cols-8 gap-1 h-full p-4';
    
    // Create mood bubbles to represent global moods
    for (let i = 0; i < 64; i++) {
      const bubble = document.createElement('div');
      const randomMood = allEntries[i % allEntries.length]?.mood || 'calm';
      const color = moodColors[randomMood];
      
      bubble.className = 'aspect-square rounded-full animate-pulse-soft transition-all duration-500 hover:scale-125 cursor-pointer';
      bubble.style.backgroundColor = color;
      bubble.style.opacity = '0.7';
      bubble.title = `Mood: ${randomMood}`;
      
      // Add random delay to animation
      bubble.style.animationDelay = `${Math.random() * 2}s`;
      
      moodGrid.appendChild(bubble);
    }
    
    if (mapContainer.current) {
      mapContainer.current.innerHTML = '';
      mapContainer.current.appendChild(moodGrid);
    }

    return () => {
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '';
      }
    };
  }, [moodEntries]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 glass-card p-3 rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Global Mood Pulse</h3>
        <div className="space-y-1">
          {Object.entries(moodColors).map(([mood, color]) => (
            <div key={mood} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{mood}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-full glass-card rounded-lg overflow-hidden"
      />
      
      <div className="absolute bottom-4 right-4 glass-card p-2 rounded text-xs text-muted-foreground">
        Live mood visualization • Updates every 30s
      </div>
    </div>
  );
};

export default MoodMap;
