
/**
 * MoodMap Component - Enhanced Mood Visualization with Sample Data
 * 
 * This component shows a more realistic mood visualization while we develop
 * the full Leaflet map integration. It includes sample mood data to demonstrate
 * the concept and provides better visual feedback.
 * 
 * Features:
 * - Grid-based mood visualization with real/sample data
 * - Color-coded mood indicators
 * - Hover tooltips with mood details
 * - Animated bubbles for visual appeal
 * - Sample data to show concentration patterns
 */

import React, { useEffect, useRef } from 'react';
import { MoodEntry, MoodType } from '@/types/mood';

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

// Sample mood data to demonstrate the concept (will be replaced with real data)
const generateSampleMoodData = (): MoodEntry[] => {
  const sampleMoods: MoodType[] = ['happy', 'calm', 'excited', 'sad', 'stressed', 'anxious'];
  const sampleCities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
  ];

  return Array.from({ length: 32 }, (_, i) => {
    const city = sampleCities[i % sampleCities.length];
    const mood = sampleMoods[Math.floor(Math.random() * sampleMoods.length)];
    
    return {
      id: `sample-${i}`,
      mood,
      message: `Feeling ${mood} today!`,
      lat: city.lat + (Math.random() - 0.5) * 2, // Add some randomness
      lng: city.lng + (Math.random() - 0.5) * 2,
      timestamp: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
      city: city.name,
      country: 'Sample Data',
    };
  });
};

const MoodMap = ({ moodEntries }: MoodMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Combine real entries with sample data for visualization
    const allEntries = [...moodEntries, ...generateSampleMoodData()];
    const totalBubbles = 64;

    // Create a grid-based mood visualization using combined data
    const moodGrid = document.createElement('div');
    moodGrid.className = 'grid grid-cols-8 gap-1 h-full p-4';
    
    for (let i = 0; i < totalBubbles; i++) {
      const bubble = document.createElement('div');
      
      // Use combined data if available
      if (i < allEntries.length) {
        const entry = allEntries[i];
        const color = moodColors[entry.mood];
        
        bubble.className = 'aspect-square rounded-full animate-pulse-soft transition-all duration-500 hover:scale-125 cursor-pointer';
        bubble.style.backgroundColor = color;
        bubble.style.opacity = '0.8';
        bubble.title = `Mood: ${entry.mood}${entry.city ? ` from ${entry.city}` : ''}${entry.message ? `\nMessage: ${entry.message.slice(0, 100)}${entry.message.length > 100 ? '...' : ''}` : ''}`;
        
        // Add click handler to show mood details
        bubble.addEventListener('click', () => {
          console.log('Mood entry:', entry);
          // Could add modal or detailed view here
        });
      } else {
        // Empty bubble for visual consistency
        bubble.className = 'aspect-square rounded-full bg-muted/20 border border-muted/30';
        bubble.style.opacity = '0.3';
      }
      
      // Add random delay to animation for active bubbles
      if (i < allEntries.length) {
        bubble.style.animationDelay = `${Math.random() * 2}s`;
      }
      
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
      {/* Enhanced Legend */}
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
        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-white/10">
          Real + sample data visualization
        </div>
      </div>
      
      <div 
        ref={mapContainer} 
        className="w-full h-full glass-card rounded-lg overflow-hidden"
      />
      
      {/* Enhanced Info Corner */}
      <div className="absolute bottom-4 right-4 glass-card p-2 rounded text-xs text-muted-foreground">
        Enhanced mood visualization • Click bubbles for details
        <br />
        <span className="text-primary">🗺️ Real map coming soon!</span>
      </div>
    </div>
  );
};

export default MoodMap;
