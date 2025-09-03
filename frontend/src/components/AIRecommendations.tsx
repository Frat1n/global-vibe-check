/**
 * AIRecommendations Component - AI-Powered Mood Suggestions
 * 
 * This component displays personalized recommendations based on user's mood patterns.
 * Features:
 * - Fetches AI recommendations from backend
 * - Shows activity suggestions based on recent moods
 * - Displays mood benefits and explanations
 * - Integrates with Emergent LLM for personalized advice
 * - Fallback recommendations when AI is unavailable
 * 
 * Provides users with actionable insights to improve their emotional well-being.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Sparkles, 
  RefreshCw, 
  Heart, 
  Star, 
  ArrowRight,
  Brain,
  Lightbulb
} from 'lucide-react';

// Recommendation interface
interface Recommendation {
  activity: string;
  explanation: string;
  mood_benefit: string;
}

interface RecommendationResponse {
  recommendations: Recommendation[];
  mood_context: string[];
  message: string;
}

interface AIRecommendationsProps {
  className?: string;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ className = '' }) => {
  // Component state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [moodContext, setMoodContext] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { user } = useAuth();
  const { toast } = useToast();

  /**
   * Fetch AI recommendations from backend
   */
  const fetchRecommendations = async () => {
    if (!user) {
      setRecommendations([]);
      setMessage('Sign in to get personalized mood recommendations');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const userToken = localStorage.getItem('user_token') || user.id || 'demo_user';

      const response = await fetch(`${backendUrl}/api/recommendations`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: RecommendationResponse = await response.json();
        setRecommendations(data.recommendations);
        setMoodContext(data.mood_context || []);
        setMessage(data.message);
      } else {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Unable to load recommendations');
      
      // Show default recommendations as fallback
      setRecommendations([
        {
          activity: "Take a mindful walk in nature",
          explanation: "Fresh air and movement can naturally boost your mood",
          mood_benefit: "stress relief & happiness"
        },
        {
          activity: "Practice gratitude journaling",
          explanation: "Writing down positive thoughts helps shift perspective",
          mood_benefit: "emotional balance"
        },
        {
          activity: "Connect with a friend or loved one",
          explanation: "Social connection is fundamental to emotional well-being",
          mood_benefit: "mood boost & support"
        }
      ]);
      setMessage('Here are some general wellness recommendations');
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh recommendations
   */
  const handleRefresh = () => {
    fetchRecommendations();
    toast({
      title: "Refreshing Recommendations",
      description: "Getting updated suggestions based on your latest moods",
    });
  };

  // Load recommendations on component mount
  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  return (
    <Card className={`glass-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold">AI Mood Recommendations</h3>
            <p className="text-xs text-muted-foreground">
              Personalized suggestions for your well-being
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="hover:bg-white/10"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Mood Context */}
      {moodContext.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">
            Based on your recent moods:
          </p>
          <div className="flex flex-wrap gap-1">
            {moodContext.map((mood, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-white/5"
              >
                {mood}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Sparkles className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              AI is analyzing your mood patterns...
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-6">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      )}

      {/* Recommendations */}
      {!loading && recommendations.length > 0 && (
        <div className="space-y-4">
          {/* Message */}
          {message && (
            <p className="text-sm text-muted-foreground bg-white/5 p-3 rounded-lg">
              <Lightbulb className="w-4 h-4 inline mr-2" />
              {message}
            </p>
          )}

          {/* Recommendation Cards */}
          {recommendations.map((rec, index) => (
            <div 
              key={index}
              className="bg-gradient-to-r from-white/5 to-white/10 p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                  <Star className="w-4 h-4 text-white" />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{rec.activity}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {rec.explanation}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-gradient-to-r from-purple-500/20 to-blue-500/20"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {rec.mood_benefit}
                    </Badge>
                  </div>
                </div>
                
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && recommendations.length === 0 && !error && (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {user ? 'Share some moods to get personalized recommendations!' : 'Sign in to get AI-powered mood recommendations'}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-muted-foreground text-center">
          <Brain className="w-3 h-3 inline mr-1" />
          Powered by AI • Updates based on your mood patterns
        </p>
      </div>
    </Card>
  );
};

export default AIRecommendations;