import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Crown, MessageCircle, Users, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PremiumModal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, session, profile, checkSubscription } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant={profile?.is_premium ? "outline" : "default"}
          size="sm"
          className={profile?.is_premium ? "border-yellow-500 text-yellow-500" : "bg-gradient-to-r from-primary to-accent"}
        >
          <Crown className="w-4 h-4 mr-2" />
          {profile?.is_premium ? 'Premium' : 'Upgrade'}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-0 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            MoodMaps Premium
            {profile?.is_premium && <Badge variant="secondary">Active</Badge>}
          </DialogTitle>
        </DialogHeader>
        
        <Card className="glass-card p-6">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold mb-2">$5<span className="text-lg font-normal">/month</span></div>
            <p className="text-muted-foreground">Unlock premium features</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>Extended mood messages (up to 10,000 characters)</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <span>Private messaging with other users</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-500" />
              <span>Connect with the global mood community</span>
            </div>
          </div>

          <div className="space-y-2">
            {profile?.is_premium ? (
              <>
                <Button 
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? 'Loading...' : 'Manage Subscription'}
                </Button>
                <Button 
                  onClick={checkSubscription}
                  className="w-full"
                  variant="ghost"
                  size="sm"
                >
                  Refresh Status
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-accent"
              >
                {isLoading ? 'Processing...' : 'Upgrade to Premium'}
              </Button>
            )}
          </div>

          {profile?.subscription_end && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              {profile.is_premium 
                ? `Renews on ${new Date(profile.subscription_end).toLocaleDateString()}`
                : `Expires on ${new Date(profile.subscription_end).toLocaleDateString()}`
              }
            </p>
          )}
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;