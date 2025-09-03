/**
 * Moodies Page - TikTok-style Video Social Platform
 * 
 * This page provides the main interface for the Moodies feature.
 * Features:
 * - Video feed with mood filtering
 * - Upload new moodies
 * - Social interactions (likes, comments, shares)
 * - Mood-based content discovery
 * - AI-powered recommendations
 * 
 * The page combines content consumption and creation in a social video format.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MoodiesFeed from '@/components/MoodiesFeed';
import MoodieUpload from '@/components/MoodieUpload';
import { MoodType } from '@/types/mood';
import { 
  Plus, 
  Filter, 
  TrendingUp, 
  Users, 
  Heart,
  Sparkles,
  Home,
  LogOut,
  LogIn
} from 'lucide-react';

// Available mood filters
const MOOD_FILTERS: { type: MoodType; emoji: string; color: string; description: string }[] = [
  { type: 'happy', emoji: '😊', color: 'bg-yellow-500', description: 'Joyful & Uplifting' },
  { type: 'excited', emoji: '🤩', color: 'bg-orange-500', description: 'High Energy & Fun' },
  { type: 'calm', emoji: '😌', color: 'bg-green-500', description: 'Peaceful & Relaxing' },
  { type: 'sad', emoji: '😢', color: 'bg-blue-500', description: 'Emotional & Heartfelt' },
  { type: 'stressed', emoji: '😰', color: 'bg-red-500', description: 'Challenging Times' },
  { type: 'anxious', emoji: '😟', color: 'bg-purple-500', description: 'Support & Understanding' },
];

interface MoodieStats {
  totalMoodies: number;
  totalCreators: number;
  totalLikes: number;
  newToday: number;
}

const Moodies: React.FC = () => {
  // Component state
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<MoodType | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [stats, setStats] = useState<MoodieStats>({
    totalMoodies: 0,
    totalCreators: 0,
    totalLikes: 0,
    newToday: 0
  });
  const [loading, setLoading] = useState(true);

  // Hooks
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  /**
   * Fetch real Moodies statistics from backend
   */
  const fetchMoodieStats = async () => {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Fetch basic moodies to calculate stats
      const response = await fetch(`${backendUrl}/api/moodies?limit=1000`);
      
      if (response.ok) {
        const moodies = await response.json();
        
        // Calculate real stats from actual data
        const totalLikes = moodies.reduce((sum: number, moodie: any) => sum + (moodie.likes_count || 0), 0);
        const uniqueCreators = new Set(moodies.map((moodie: any) => moodie.user_id)).size;
        const today = new Date().toDateString();
        const newToday = moodies.filter((moodie: any) => 
          new Date(moodie.created_at).toDateString() === today
        ).length;

        setStats({
          totalMoodies: moodies.length,
          totalCreators: uniqueCreators,
          totalLikes: totalLikes,
          newToday: newToday
        });
      } else {
        // If no data available, show zeros
        setStats({
          totalMoodies: 0,
          totalCreators: 0,
          totalLikes: 0,
          newToday: 0
        });
      }
    } catch (error) {
      console.error('Error fetching moodie stats:', error);
      setStats({
        totalMoodies: 0,
        totalCreators: 0,
        totalLikes: 0,
        newToday: 0
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle mood filter selection
   */
  const handleMoodFilter = (mood: MoodType | null) => {
    setSelectedMoodFilter(mood);
  };

  /**
   * Handle successful upload
   */
  const handleUploadComplete = () => {
    // Refresh the feed and stats
    setFeedKey(prev => prev + 1);
    fetchMoodieStats();
  };

  /**
   * Navigate back to main app
   */
  const handleBackToHome = () => {
    navigate('/');
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchMoodieStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToHome}
              className="hover:bg-white/20"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Moodies
              </h1>
              <p className="text-muted-foreground">
                Share your emotions through video stories
              </p>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Welcome, {user.email?.split('@')[0]}
                </span>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Moodie
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => navigate('/auth')}
                disabled={isLoading}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Real Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : stats.totalMoodies}
                </p>
                <p className="text-xs text-muted-foreground">Total Moodies</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Users className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : stats.totalCreators}
                </p>
                <p className="text-xs text-muted-foreground">Active Creators</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : stats.totalLikes}
                </p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : stats.newToday}
                </p>
                <p className="text-xs text-muted-foreground">New Today</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Mood Filters */}
          <div className="lg:col-span-1">
            <Card className="glass-card p-4 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4" />
                <h3 className="font-semibold">Filter by Mood</h3>
              </div>

              {/* All Moodies Option */}
              <Button
                variant={selectedMoodFilter === null ? "default" : "ghost"}
                className="w-full justify-start mb-2"
                onClick={() => handleMoodFilter(null)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                All Moodies
              </Button>

              {/* Mood Filter Options */}
              <div className="space-y-2">
                {MOOD_FILTERS.map(({ type, emoji, color, description }) => (
                  <Button
                    key={type}
                    variant={selectedMoodFilter === type ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      selectedMoodFilter === type ? color : ''
                    }`}
                    onClick={() => handleMoodFilter(type)}
                  >
                    <span className="mr-2">{emoji}</span>
                    <div className="text-left flex-1">
                      <div className="font-medium capitalize">{type}</div>
                      <div className="text-xs opacity-70">{description}</div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Filter Info */}
              {selectedMoodFilter && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Showing {selectedMoodFilter} moodies that match your mood or 
                    can help improve it.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Main Content - Moodies Feed */}
          <div className="lg:col-span-3">
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {selectedMoodFilter ? (
                    <>
                      <span className="mr-2">
                        {MOOD_FILTERS.find(f => f.type === selectedMoodFilter)?.emoji}
                      </span>
                      {selectedMoodFilter.charAt(0).toUpperCase() + selectedMoodFilter.slice(1)} Moodies
                    </>
                  ) : (
                    'Latest Moodies'
                  )}
                </h2>

                {!user && (
                  <Badge variant="outline" className="text-xs">
                    Sign in to create and interact
                  </Badge>
                )}
              </div>

              {/* Moodies Feed */}
              <MoodiesFeed 
                key={feedKey}
                moodFilter={selectedMoodFilter}
              />
            </Card>
          </div>
        </div>

        {/* Upload Modal */}
        <MoodieUpload
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={handleUploadComplete}
        />

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Express yourself • Connect through emotions • Discover new perspectives
          </p>
        </div>
      </div>
    </div>
  );
};

export default Moodies;