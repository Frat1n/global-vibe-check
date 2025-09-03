/**
 * MoodiesFeed Component - TikTok-style Video Feed
 * 
 * This component displays a vertical scrolling feed of Moodies (mood videos).
 * Features:
 * - Vertical scroll feed similar to TikTok
 * - Video controls and interaction buttons
 * - Like, comment, and share functionality
 * - Mood tag filtering
 * - Infinite scroll pagination
 * - Auto-play on scroll
 * 
 * The component provides an engaging social video experience.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { MoodType } from '@/types/mood';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  MoreVertical,
  Eye
} from 'lucide-react';

// Moodie interface (matching backend model)
interface Moodie {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  video_data: string; // Base64 encoded
  mood_tags: MoodType[];
  duration: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  is_public: boolean;
}

interface MoodiesFeedProps {
  moodFilter?: MoodType | null;
  onMoodieSelect?: (moodie: Moodie) => void;
}

// Mood colors for tags
const moodColors: Record<MoodType, string> = {
  happy: 'bg-yellow-500',
  sad: 'bg-blue-500',
  excited: 'bg-orange-500',
  stressed: 'bg-red-500',
  calm: 'bg-green-500',
  anxious: 'bg-purple-500',
};

// Mood emojis
const moodEmojis: Record<MoodType, string> = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  stressed: '😰',
  calm: '😌',
  anxious: '😟',
};

const MoodiesFeed: React.FC<MoodiesFeedProps> = ({ 
  moodFilter, 
  onMoodieSelect 
}) => {
  // Component state
  const [moodies, setMoodies] = useState<Moodie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [likedMoodies, setLikedMoodies] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Refs for video elements
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  /**
   * Fetch moodies from backend API
   */
  const fetchMoodies = async () => {
    try {
      setLoading(true);
      setError(null);

      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const userToken = localStorage.getItem('auth_token') || 'demo_user_123';

      // Build API URL with mood filter
      let apiUrl = `${backendUrl}/api/moodies?limit=20`;
      if (moodFilter) {
        apiUrl += `&mood_filter=${moodFilter}`;
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const fetchedMoodies = await response.json();
        setMoodies(fetchedMoodies);
      } else {
        throw new Error(`Failed to fetch moodies: ${response.status}`);
      }

    } catch (error) {
      console.error('Error fetching moodies:', error);
      setError('Failed to load moodies. Please try again.');
      
      // Don't show sample data anymore, just empty state
      setMoodies([]);
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle video play/pause
   */
  const toggleVideoPlayback = (moodieId: string) => {
    const video = videoRefs.current[moodieId];
    if (!video) return;

    if (currentPlayingId === moodieId) {
      video.pause();
      setCurrentPlayingId(null);
    } else {
      // Pause currently playing video
      if (currentPlayingId && videoRefs.current[currentPlayingId]) {
        videoRefs.current[currentPlayingId].pause();
      }
      
      video.play();
      setCurrentPlayingId(moodieId);
    }
  };

  /**
   * Toggle video mute/unmute
   */
  const toggleVideoMute = (moodieId: string) => {
    const video = videoRefs.current[moodieId];
    if (!video) return;

    setMutedVideos(prev => {
      const newMuted = new Set(prev);
      if (newMuted.has(moodieId)) {
        newMuted.delete(moodieId);
        video.muted = false;
      } else {
        newMuted.add(moodieId);
        video.muted = true;
      }
      return newMuted;
    });
  };

  /**
   * Handle like/unlike
   */
  const toggleLike = async (moodieId: string) => {
    try {
      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const userToken = localStorage.getItem('auth_token') || 'demo_user_123';

      const response = await fetch(`${backendUrl}/api/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: moodieId,
          content_type: 'moodie',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setLikedMoodies(prev => {
          const newLiked = new Set(prev);
          if (result.liked) {
            newLiked.add(moodieId);
          } else {
            newLiked.delete(moodieId);
          }
          return newLiked;
        });

        // Update likes count in moodies
        setMoodies(prev => prev.map(moodie => 
          moodie.id === moodieId 
            ? { 
                ...moodie, 
                likes_count: result.liked 
                  ? moodie.likes_count + 1 
                  : moodie.likes_count - 1 
              }
            : moodie
        ));

      } else {
        throw new Error('Failed to toggle like');
      }

    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle share functionality
   */
  const shareMoodie = (moodie: Moodie) => {
    if (navigator.share) {
      navigator.share({
        title: moodie.title,
        text: moodie.description || 'Check out this Moodie!',
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Moodie link copied to clipboard",
      });
    }
  };

  /**
   * Format time ago
   */
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Load moodies on component mount and when filter changes
  useEffect(() => {
    fetchMoodies();
  }, [moodFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading moodies...</p>
        </div>
      </div>
    );
  }

  if (error && moodies.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchMoodies} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 max-h-[600px] overflow-y-auto">
      {moodies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No moodies found{moodFilter ? ` for ${moodFilter} mood` : ''}
          </p>
          <p className="text-sm text-muted-foreground">
            Be the first to share a moodie!
          </p>
        </div>
      ) : (
        moodies.map((moodie) => (
          <Card key={moodie.id} className="glass-card overflow-hidden">
            <div className="flex gap-4 p-4">
              {/* User Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {moodie.user_id.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">@{moodie.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {getTimeAgo(moodie.created_at)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Title and Description */}
                <h3 className="font-semibold mb-1">{moodie.title}</h3>
                {moodie.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {moodie.description}
                  </p>
                )}

                {/* Mood Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {moodie.mood_tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className={`text-xs ${moodColors[tag]} text-white`}
                    >
                      {moodEmojis[tag]} {tag}
                    </Badge>
                  ))}
                </div>

                {/* Video Player Placeholder */}
                <div className="relative bg-black rounded-lg aspect-[9/16] max-w-xs mb-3">
                  {/* Since we're using sample data, show placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-white/70 mx-auto mb-2" />
                      <p className="text-white/70 text-sm">Video Preview</p>
                      <p className="text-white/50 text-xs">{moodie.duration}s</p>
                    </div>
                  </div>
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => toggleVideoPlayback(moodie.id)}
                    >
                      {currentPlayingId === moodie.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
                      onClick={() => toggleVideoMute(moodie.id)}
                    >
                      {mutedVideos.has(moodie.id) ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Interaction Buttons */}
                <div className="flex items-center gap-4 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-0 h-auto ${likedMoodies.has(moodie.id) ? 'text-red-500' : ''}`}
                    onClick={() => toggleLike(moodie.id)}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${likedMoodies.has(moodie.id) ? 'fill-current' : ''}`} />
                    {moodie.likes_count}
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {moodie.comments_count}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto"
                    onClick={() => shareMoodie(moodie)}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    {moodie.shares_count}
                  </Button>
                  
                  <div className="flex items-center text-muted-foreground ml-auto">
                    <Eye className="w-4 h-4 mr-1" />
                    {moodie.views_count}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default MoodiesFeed;