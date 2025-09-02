
export type MoodType = 'happy' | 'sad' | 'excited' | 'stressed' | 'calm' | 'anxious';

export interface MoodEntry {
  id: string;
  mood: MoodType;
  message?: string;
  lat: number;
  lng: number;
  timestamp: Date;
  country?: string;
  city?: string;
}

export interface MoodStats {
  total: number;
  breakdown: Record<MoodType, number>;
  topMood: MoodType;
}
