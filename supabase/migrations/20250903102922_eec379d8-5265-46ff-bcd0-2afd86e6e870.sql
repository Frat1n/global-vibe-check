-- Fix security vulnerability: Restrict profiles table access to own profile only

-- Drop the overly permissive policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policy - users can only view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a function to get public profile data (display_name, avatar_url only)
-- This will be used for messaging functionality without exposing sensitive data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    display_name,
    avatar_url
  FROM profiles 
  WHERE user_id = profile_user_id;
$$;