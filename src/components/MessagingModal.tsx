import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

const MessagingModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user?.id)
        .limit(20);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('private_messages')
        .update({ read: true })
        .eq('recipient_id', user?.id)
        .eq('sender_id', otherUserId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedProfile || !newMessage.trim() || !user) return;

    if (!profile?.is_premium) {
      toast({
        title: "Premium Feature",
        description: "Private messaging is a premium feature. Upgrade to send messages!",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedProfile.user_id,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages(selectedProfile.user_id);
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchProfiles();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedProfile) {
      fetchMessages(selectedProfile.user_id);
    }
  }, [selectedProfile]);

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="w-4 h-4 mr-2" />
          Messages
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-0 max-w-4xl h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Private Messages
            {!profile?.is_premium && (
              <span className="text-sm text-muted-foreground">(Premium Feature)</span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full gap-4">
          {/* User List */}
          <div className="w-1/3 border-r border-border/50 pr-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Users</span>
            </div>
            <ScrollArea className="h-[450px]">
              <div className="space-y-2">
                {profiles.map((prof) => (
                  <div
                    key={prof.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedProfile?.id === prof.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedProfile(prof)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {prof.display_name?.[0]?.toUpperCase() || prof.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {prof.display_name || prof.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prof.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {selectedProfile ? (
              <>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
                  <Avatar>
                    <AvatarFallback>
                      {selectedProfile.display_name?.[0]?.toUpperCase() || selectedProfile.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedProfile.display_name || selectedProfile.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedProfile.email}
                    </p>
                  </div>
                </div>

                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4 pr-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender_id === user.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    placeholder={
                      profile?.is_premium 
                        ? "Type your message..." 
                        : "Upgrade to Premium to send messages"
                    }
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={!profile?.is_premium}
                    className="resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !newMessage.trim() || !profile?.is_premium}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a user to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;