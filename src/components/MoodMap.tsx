
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

const MoodMap = ({ moodEntries }: MoodMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Create a grid-based mood visualization using real data
    const moodGrid = document.createElement('div');
    moodGrid.className = 'grid grid-cols-8 gap-1 h-full p-4';
    
    // If we have real entries, use them; otherwise show empty state
    const entriesToShow = moodEntries.length > 0 ? moodEntries : [];
    const totalBubbles = 64;
    
    for (let i = 0; i < totalBubbles; i++) {
      const bubble = document.createElement('div');
      
      // Use real mood data if available, otherwise create empty bubbles
      if (i < entriesToShow.length) {
        const entry = entriesToShow[i];
        const color = moodColors[entry.mood];
        
        bubble.className = 'aspect-square rounded-full animate-pulse-soft transition-all duration-500 hover:scale-125 cursor-pointer';
        bubble.style.backgroundColor = color;
        bubble.style.opacity = '0.8';
        bubble.title = `Mood: ${entry.mood}${entry.city ? ` from ${entry.city}` : ''}${entry.message ? `\nMessage: ${entry.message.slice(0, 100)}${entry.message.length > 100 ? '...' : ''}` : ''}`;
        
        // Add click handler to show mood details
        bubble.addEventListener('click', () => {
          console.log('Mood entry:', entry);
        });
      } else {
        // Empty bubble for visual consistency
        bubble.className = 'aspect-square rounded-full bg-muted/20 border border-muted/30';
        bubble.style.opacity = '0.3';
      }
      
      // Add random delay to animation for active bubbles
      if (i < entriesToShow.length) {
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
