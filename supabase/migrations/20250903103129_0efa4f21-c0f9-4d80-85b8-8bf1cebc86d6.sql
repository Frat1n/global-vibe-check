-- Fix location privacy vulnerability: Restrict mood_entries access and create anonymized public view

-- Drop the overly permissive policy that allows viewing all mood entries
DROP POLICY IF EXISTS "Users can view all mood entries" ON public.mood_entries;

-- Create restrictive policy - users can only view their own mood entries
CREATE POLICY "Users can view their own mood entries" 
ON public.mood_entries 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a secure function to get anonymized mood data for public map
-- This removes exact coordinates and personal messages while preserving general location trends
CREATE OR REPLACE FUNCTION public.get_public_mood_data()
RETURNS TABLE (
  mood text,
  country text,
  city text,
  approximate_lat double precision,
  approximate_lng double precision,
  entry_count bigint,
  created_date date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    mood,
    country,
    city,
    -- Round coordinates to ~1km precision to protect exact locations
    ROUND(AVG(latitude)::numeric, 2)::double precision as approximate_lat,
    ROUND(AVG(longitude)::numeric, 2)::double precision as approximate_lng,
    COUNT(*) as entry_count,
    created_at::date as created_date
  FROM mood_entries 
  WHERE created_at > NOW() - INTERVAL '30 days'  -- Only show recent data
  GROUP BY mood, country, city, created_at::date
  HAVING COUNT(*) >= 3  -- Only show areas with multiple entries for privacy
  ORDER BY created_date DESC
  LIMIT 1000;
$$;

-- Create a function to get user's own detailed mood history
CREATE OR REPLACE FUNCTION public.get_user_mood_history(limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  mood text,
  message text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    mood,
    message,
    city,
    country,
    latitude,
    longitude,
    created_at
  FROM mood_entries 
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;