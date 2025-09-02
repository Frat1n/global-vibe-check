
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MoodType } from '@/types/mood';

const moodOptions: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'happy', emoji: '😊', label: 'Happy' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'excited', emoji: '🤩', label: 'Excited' },
  { type: 'stressed', emoji: '😰', label: 'Stressed' },
  { type: 'calm', emoji: '😌', label: 'Calm' },
  { type: 'anxious', emoji: '😟', label: 'Anxious' },
];

interface MoodSelectorProps {
  onSubmit: (mood: MoodType, message?: string) => void;
  isSubmitting?: boolean;
}

const MoodSelector = ({ onSubmit, isSubmitting }: MoodSelectorProps) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (selectedMood) {
      onSubmit(selectedMood, message.trim() || undefined);
      setSelectedMood(null);
      setMessage('');
    }
  };

  return (
    <Card className="glass-card p-6 w-full max-w-md animate-float">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">How are you feeling?</h2>
          <p className="text-sm text-muted-foreground">Share your mood with the world</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {moodOptions.map((option) => (
            <Button
              key={option.type}
              variant={selectedMood === option.type ? "default" : "outline"}
              className={`h-20 flex flex-col gap-1 transition-all duration-200 hover:scale-105 ${
                selectedMood === option.type ? `mood-${option.type}` : ''
              }`}
              onClick={() => setSelectedMood(option.type)}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </Button>
          ))}
        </div>

        {selectedMood && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <Textarea
              placeholder="Why do you feel this way? (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none glass-card border-0"
              rows={3}
            />
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? 'Sharing your mood...' : 'Share My Mood'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MoodSelector;
