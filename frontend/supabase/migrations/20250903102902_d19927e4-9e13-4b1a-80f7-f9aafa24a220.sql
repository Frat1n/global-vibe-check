-- Fix security vulnerability: Restrict profiles table access and create public view

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policy for viewing own profile data
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a public profiles view that only exposes safe, non-sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Create policy for public profiles view - allow all authenticated users to view public data
CREATE POLICY "Public profiles viewable by authenticated users" 
ON public.public_profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');