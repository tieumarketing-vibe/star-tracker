-- Weekly Challenge Migration
-- Run this in Supabase SQL Editor

-- Add weekly challenge columns to rewards
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS is_weekly_challenge BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS weekly_bonus_stars INT NOT NULL DEFAULT 5;

-- Weekly challenge progress tracking
CREATE TABLE IF NOT EXISTS public.weekly_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  day_1 BOOLEAN NOT NULL DEFAULT false,
  day_2 BOOLEAN NOT NULL DEFAULT false,
  day_3 BOOLEAN NOT NULL DEFAULT false,
  day_4 BOOLEAN NOT NULL DEFAULT false,
  day_5 BOOLEAN NOT NULL DEFAULT false,
  day_6 BOOLEAN NOT NULL DEFAULT false,
  day_7 BOOLEAN NOT NULL DEFAULT false,
  bonus_awarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, reward_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_challenge_child ON public.weekly_challenge_progress(child_id, week_start);

ALTER TABLE public.weekly_challenge_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users full access weekly_challenge_progress" ON public.weekly_challenge_progress;
CREATE POLICY "Authenticated users full access weekly_challenge_progress" ON public.weekly_challenge_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);
