
import { useState, useEffect } from 'react';
import { MoodEntry, MoodStats, MoodType } from '@/types/mood';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useMoodData = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [stats, setStats] = useState<MoodStats>({
    total: 0,
    breakdown: {
      happy: 0,
      calm: 0,
      excited: 0,
      sad: 0,
      stressed: 0,
      anxious: 0,
    },
    topMood: 'happy',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Fetch mood entries from Supabase
  const fetchMoodEntries = async () => {
    try {
      // Fetch anonymized public mood data for map and stats
      const { data: publicData, error: publicError } = await supabase.rpc('get_public_mood_data');
      
      if (publicError) throw publicError;

      // Convert public data to MoodEntry format for compatibility
      const publicEntries: MoodEntry[] = (publicData || []).map(entry => ({
        id: `${entry.mood}-${entry.city}-${entry.created_date}`, // Generate synthetic ID
        mood: entry.mood as MoodType,
        message: null, // No personal messages in public data
        lat: entry.approximate_lat,
        lng: entry.approximate_lng,
        timestamp: new Date(entry.created_date),
        city: entry.city,
        country: entry.country,
      }));

      // If user is logged in, also fetch their own detailed entries
      if (user) {
        const { data: userEntries, error: userError } = await supabase.rpc('get_user_mood_history');
        
        if (userError) {
          console.error('Error fetching user entries:', userError);
        } else {
          // Combine user's detailed entries with anonymized public data
          const userMoodEntries: MoodEntry[] = (userEntries || []).map(entry => ({
            id: entry.id,
            mood: entry.mood as MoodType,
            message: entry.message,
            lat: entry.latitude,
            lng: entry.longitude,
            timestamp: new Date(entry.created_at),
            city: entry.city,
            country: entry.country,
          }));
          
          // Filter out potential duplicates and combine
          const combinedEntries = [
            ...userMoodEntries,
            ...publicEntries.filter(entry => 
              // Avoid duplicating user's own entries in public data
              !userMoodEntries.some(userEntry => 
                Math.abs(userEntry.lat - entry.lat) < 0.01 &&
                Math.abs(userEntry.lng - entry.lng) < 0.01 &&
                userEntry.mood === entry.mood
              )
            )
          ];
          setMoodEntries(combinedEntries);
          return;
        }
      }

      // If not logged in or user entries failed, just use public data
      setMoodEntries(publicEntries);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      toast({
        title: "Error",
        description: "Failed to load mood data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate stats from mood entries
  const calculateStats = (entries: MoodEntry[]): MoodStats => {
    const breakdown = {
      happy: 0,
      calm: 0,
      excited: 0,
      sad: 0,
      stressed: 0,
      anxious: 0,
    };

    entries.forEach(entry => {
      breakdown[entry.mood]++;
    });

    const topMood = Object.entries(breakdown).reduce((a, b) => 
      breakdown[a[0] as MoodType] > breakdown[b[0] as MoodType] ? a : b
    )[0] as MoodType;

    return {
      total: entries.length,
      breakdown,
      topMood,
    };
  };

  const submitMood = async (mood: MoodType, message?: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to share your mood.",
        variant: "destructive",
      });
      return;
    }

    // Check character limit based on premium status
    const maxChars = profile?.is_premium ? 10000 : 2000;
    if (message && message.length > maxChars) {
      toast({
        title: "Message Too Long",
        description: `Your message exceeds the ${maxChars} character limit${!profile?.is_premium ? '. Upgrade to Premium for 10,000 characters!' : ''}.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get user location
      let lat = 40.7128; // Default to NYC
      let lng = -74.0060;
      let city = 'Unknown';
      let country = 'Unknown';

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true,
            });
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
          
          // Optionally, you could reverse geocode to get city/country
          // For now, we'll leave them as default values
        } catch (geoError) {
          console.log('Geolocation not available, using default location');
        }
      }

      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood,
          message: message || null,
          latitude: lat,
          longitude: lng,
          city,
          country,
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new entry to local state
      const newEntry: MoodEntry = {
        id: data.id,
        mood: data.mood as MoodType,
        message: data.message,
        lat: data.latitude,
        lng: data.longitude,
        timestamp: new Date(data.created_at),
        city: data.city,
        country: data.country,
      };

      setMoodEntries(prev => [newEntry, ...prev]);
      
      toast({
        title: "Mood Shared!",
        description: "Your mood has been added to your personal history.",
      });
    } catch (error) {
      console.error('Failed to submit mood:', error);
      toast({
        title: "Error",
        description: "Failed to share your mood. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load mood entries on component mount
  useEffect(() => {
    fetchMoodEntries();
  }, []);

  // Update stats when mood entries change
  useEffect(() => {
    setStats(calculateStats(moodEntries));
  }, [moodEntries]);

  // Set up real-time subscription for new mood entries (user's own entries only)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_mood_entries_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mood_entries',
          filter: `user_id=eq.${user.id}` // Only subscribe to user's own entries
        },
        (payload) => {
          const newEntry: MoodEntry = {
            id: payload.new.id,
            mood: payload.new.mood as MoodType,
            message: payload.new.message,
            lat: payload.new.latitude,
            lng: payload.new.longitude,
            timestamp: new Date(payload.new.created_at),
            city: payload.new.city,
            country: payload.new.country,
          };
          
          setMoodEntries(prev => [newEntry, ...prev.slice(0, 99)]); // Keep only latest 100
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    moodEntries,
    stats,
    isSubmitting,
    submitMood,
  };
};
