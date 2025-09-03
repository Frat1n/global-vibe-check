/**
 * MoodieUpload Component - TikTok-style Video Upload Interface
 * 
 * This component allows users to upload short videos (Moodies) with mood tags.
 * Features:
 * - Video file selection and preview
 * - Mood tag selection
 * - Title and description input
 * - Upload progress indicator
 * - Integration with backend API
 * 
 * The component follows TikTok-style UX patterns for familiarity.
 */

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MoodType } from '@/types/mood';
import { Upload, Video, X, Tag, Play, Pause } from 'lucide-react';

// Available mood tags for videos
const MOOD_TAGS: { type: MoodType; emoji: string; color: string }[] = [
  { type: 'happy', emoji: '😊', color: 'bg-yellow-500' },
  { type: 'excited', emoji: '🤩', color: 'bg-orange-500' },
  { type: 'calm', emoji: '😌', color: 'bg-green-500' },
  { type: 'sad', emoji: '😢', color: 'bg-blue-500' },
  { type: 'stressed', emoji: '😰', color: 'bg-red-500' },
  { type: 'anxious', emoji: '😟', color: 'bg-purple-500' },
];

interface MoodieUploadProps {
  onUploadComplete?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const MoodieUpload: React.FC<MoodieUploadProps> = ({ 
  onUploadComplete, 
  isOpen, 
  onClose 
}) => {
  // Component state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMoodTags, setSelectedMoodTags] = useState<MoodType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { toast } = useToast();

  /**
   * Handle video file selection
   * Validates file type and size, creates preview
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file (MP4, MOV, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 50MB for demo)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a video smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create video preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);
    
    // Auto-generate title from filename if empty
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setTitle(fileName);
    }
  };

  /**
   * Toggle mood tag selection
   */
  const toggleMoodTag = (moodTag: MoodType) => {
    setSelectedMoodTags(prev => {
      if (prev.includes(moodTag)) {
        return prev.filter(tag => tag !== moodTag);
      } else {
        return [...prev, moodTag];
      }
    });
  };

  /**
   * Handle video play/pause
   */
  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  /**
   * Upload video to backend API
   */
  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a video and provide a title",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get backend URL from environment
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || 
                         process.env.REACT_APP_BACKEND_URL || 
                         'https://emote-mapper.preview.emergentagent.com';
      
      // Get user token (using MongoDB auth token)
      const userToken = localStorage.getItem('auth_token') || 'demo_user_123';

      // Create form data for file upload
      const formData = new FormData();
      formData.append('video_file', selectedFile);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('mood_tags', JSON.stringify(selectedMoodTags));

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to backend API
      const response = await fetch(`${backendUrl}/api/moodies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Moodie Uploaded! 🎉",
          description: "Your video has been shared with the community",
        });

        // Reset form
        resetForm();
        onUploadComplete?.();
        onClose();
        
      } else {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your Moodie. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    setTitle('');
    setDescription('');
    setSelectedMoodTags([]);
    setIsPlaying(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Share Your Moodie
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Video Upload Section */}
          {!selectedFile ? (
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">
                Choose Your Video
              </Label>
              <div 
                className="border-2 border-dashed border-muted/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Select a video to share</p>
                <p className="text-sm text-muted-foreground">
                  MP4, MOV, or other video formats • Max 50MB
                </p>
                <Button className="mt-4" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            /* Video Preview Section */
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">
                Video Preview
              </Label>
              <div className="relative rounded-lg overflow-hidden bg-black max-w-sm mx-auto">
                <video
                  ref={videoRef}
                  src={videoPreview || undefined}
                  className="w-full aspect-[9/16] object-cover" // TikTok aspect ratio
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  loop
                  muted
                />
                {/* Play/Pause Overlay */}
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={toggleVideoPlayback}
                >
                  <div className="bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Change Video Button */}
              <div className="text-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Video
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your Moodie a catchy title..."
                className="glass-card border-0"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more about your mood and video..."
                className="glass-card border-0 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/500 characters
              </p>
            </div>

            {/* Mood Tags */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                <Tag className="w-4 h-4 inline mr-1" />
                Mood Tags
              </Label>
              <div className="flex flex-wrap gap-2">
                {MOOD_TAGS.map(({ type, emoji, color }) => (
                  <Badge
                    key={type}
                    variant={selectedMoodTags.includes(type) ? "default" : "outline"}
                    className={`cursor-pointer hover:scale-105 transition-transform ${
                      selectedMoodTags.includes(type) ? color : 'hover:bg-white/10'
                    }`}
                    onClick={() => toggleMoodTag(type)}
                  >
                    {emoji} {type}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Select mood tags to help others discover your content
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || isUploading}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              {isUploading ? 'Uploading...' : 'Share Moodie'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MoodieUpload;