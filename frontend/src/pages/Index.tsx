
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Video } from 'lucide-react';
import MoodSelector from '@/components/MoodSelector';
import MoodMap from '@/components/MoodMap';
import LeafletMap from '@/components/LeafletMap';
import MoodStats from '@/components/MoodStats';
import PremiumModal from '@/components/PremiumModal';
import MessagingModal from '@/components/MessagingModal';
import { useMoodData } from '@/hooks/useMoodData';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { moodEntries, stats, isSubmitting, submitMood } = useMoodData();
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-float">
              MoodMaps
            </h1>
            <div className="flex-1 flex justify-end gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Welcome, {user.email?.split('@')[0]}
                  </span>
                  <PremiumModal />
                  <MessagingModal />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    disabled={isLoading}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  disabled={isLoading}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your emotions and explore the global mood in real-time. 
            Connect with the world through the universal language of feelings.
          </p>
          {!user && (
            <p className="text-sm text-muted-foreground mt-2">
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary"
                onClick={() => navigate('/auth')}
              >
                Sign in
              </Button>
              {' '}to share your mood and unlock premium features
            </p>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Left Panel - Mood Selector */}
          <div className="flex items-center justify-center">
            <MoodSelector onSubmit={submitMood} isSubmitting={isSubmitting} />
          </div>

          {/* Center - Enhanced Map (temporarily using original while debugging) */}
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
          <p>Made with ❤️ for emotional connection • Real-time global moods</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
