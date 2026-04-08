-- Migration: Restricted Rewards (Activity-specific star source)
-- Run this in Supabase SQL Editor

-- 1. Add required_activity_type_id column to rewards
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS required_activity_type_id UUID REFERENCES public.activity_types(id) ON DELETE SET NULL;

-- 2. RPC: Calculate activity-specific star balance
CREATE OR REPLACE FUNCTION public.get_activity_star_balance(p_child_id UUID, p_activity_type_id UUID)
RETURNS INT AS $$
DECLARE
    v_earned INT;
    v_spent INT;
BEGIN
    -- Stars earned from this specific activity
    SELECT COALESCE(SUM(ed.stars_earned), 0) INTO v_earned
    FROM public.evaluation_details ed
    JOIN public.daily_evaluations de ON de.id = ed.evaluation_id
    WHERE de.child_id = p_child_id
      AND ed.activity_type_id = p_activity_type_id;

    -- Stars already spent on rewards restricted to this activity
    SELECT COALESCE(SUM(rr.stars_spent), 0) INTO v_spent
    FROM public.reward_redemptions rr
    JOIN public.rewards r ON r.id = rr.reward_id
    WHERE rr.child_id = p_child_id
      AND r.required_activity_type_id = p_activity_type_id
      AND rr.status != 'rejected';

    RETURN v_earned - v_spent;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Seed: "Học thuộc tiếng anh H8" activity type
INSERT INTO public.activity_types (name, icon, description, star_level_1, star_level_2, star_level_3, sort_order)
VALUES ('Học thuộc tiếng anh H8', '🇬🇧', 'Học thuộc bài tiếng Anh lớp 8', 1, 2, 3, 10);

-- 4. Seed: "Xem giải trí 8 phút" reward (linked to H8)
INSERT INTO public.rewards (name, description, star_cost, tier, required_activity_type_id)
SELECT
    'Xem giải trí 8 phút',
    'Được xem giải trí 8 phút. Chỉ đổi được bằng ⭐ từ task Học thuộc tiếng Anh H8.',
    3,
    'weekly',
    id
FROM public.activity_types WHERE name = 'Học thuộc tiếng anh H8';
