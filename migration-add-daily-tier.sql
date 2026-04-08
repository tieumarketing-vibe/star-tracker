-- Migration: Add Daily Reward Tier
-- Run this in Supabase SQL Editor

-- 1. Drop existing constraint
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_tier_check;

-- 2. Add new constraint with 'daily'
ALTER TABLE public.rewards ADD CONSTRAINT rewards_tier_check 
CHECK (tier IN ('daily', 'weekly', 'monthly', 'yearly'));
