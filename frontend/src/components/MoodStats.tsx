
import React from 'react';
import { Card } from '@/components/ui/card';
import { MoodStats as MoodStatsType, MoodType } from '@/types/mood';

interface MoodStatsProps {
  stats: MoodStatsType;
}

const moodEmojis: Record<MoodType, string> = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  stressed: '😰',
  calm: '😌',
  anxious: '😟',
};

const MoodStats = ({ stats }: MoodStatsProps) => {
  const getPercentage = (count: number) => {
    return stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0;
  };

  return (
    <Card className="glass-card p-6 w-full max-w-sm">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-1">Global Mood Stats</h3>
          <p className="text-sm text-muted-foreground">{stats.total} people sharing</p>
        </div>

        <div className="space-y-3">
          <div className="text-center p-3 glass-card rounded-lg">
            <div className="text-2xl mb-1">{moodEmojis[stats.topMood]}</div>
            <div className="text-sm font-medium capitalize">Top Mood: {stats.topMood}</div>
          </div>

          <div className="space-y-2">
            {Object.entries(stats.breakdown).map(([mood, count]) => (
              <div key={mood} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{moodEmojis[mood as MoodType]}</span>
                  <span className="text-sm capitalize">{mood}</span>
                </div>
                <div className="text-sm font-medium">
                  {getPercentage(count)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-center text-muted-foreground pt-2 border-t border-white/10">
          Updates in real-time
        </div>
      </div>
    </Card>
  );
};

export default MoodStats;
