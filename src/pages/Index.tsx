
import React from 'react';
import MoodSelector from '@/components/MoodSelector';
import MoodMap from '@/components/MoodMap';
import MoodStats from '@/components/MoodStats';
import { useMoodData } from '@/hooks/useMoodData';

const Index = () => {
  const { moodEntries, stats, isSubmitting, submitMood } = useMoodData();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-float">
            MoodMaps
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your emotions and explore the global mood in real-time. 
            Connect with the world through the universal language of feelings.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Left Panel - Mood Selector */}
          <div className="flex items-center justify-center">
            <MoodSelector onSubmit={submitMood} isSubmitting={isSubmitting} />
          </div>

          {/* Center - Map */}
          <div className="lg:col-span-1">
            <MoodMap moodEntries={moodEntries} />
          </div>

          {/* Right Panel - Stats */}
          <div className="flex items-center justify-center">
            <MoodStats stats={stats} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Made with ❤️ for emotional connection • Anonymous & Private</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
