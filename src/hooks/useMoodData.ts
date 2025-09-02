
import { useState, useEffect } from 'react';
import { MoodEntry, MoodStats, MoodType } from '@/types/mood';

// Mock data and stats for MVP
const initialStats: MoodStats = {
  total: 1247,
  breakdown: {
    happy: 342,
    calm: 298,
    excited: 189,
    sad: 156,
    stressed: 143,
    anxious: 119,
  },
  topMood: 'happy',
};

export const useMoodData = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats>(initialStats);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitMood = async (mood: MoodType, message?: string) => {
    setIsSubmitting(true);
    
    try {
      // Simulate getting user location (in production, use Geolocation API)
      const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
      const lng = -74.0060 + (Math.random() - 0.5) * 0.1;
      
      const newEntry: MoodEntry = {
        id: Date.now().toString(),
        mood,
        message,
        lat,
        lng,
        timestamp: new Date(),
        city: 'Your City',
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMoodEntries(prev => [newEntry, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        breakdown: {
          ...prev.breakdown,
          [mood]: prev.breakdown[mood] + 1,
        },
      }));
      
      console.log('Mood submitted:', newEntry);
    } catch (error) {
      console.error('Failed to submit mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update some stats to simulate real-time activity
      setStats(prev => {
        const moods: MoodType[] = ['happy', 'sad', 'excited', 'stressed', 'calm', 'anxious'];
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        
        const newBreakdown = {
          ...prev.breakdown,
          [randomMood]: prev.breakdown[randomMood] + Math.floor(Math.random() * 3),
        };
        
        const newTotal = Object.values(newBreakdown).reduce((sum, count) => sum + count, 0);
        const topMood = Object.entries(newBreakdown).reduce((a, b) => 
          newBreakdown[a[0] as MoodType] > newBreakdown[b[0] as MoodType] ? a : b
        )[0] as MoodType;
        
        return {
          total: newTotal,
          breakdown: newBreakdown,
          topMood,
        };
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    moodEntries,
    stats,
    isSubmitting,
    submitMood,
  };
};
