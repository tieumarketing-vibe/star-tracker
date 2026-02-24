-- Star Tracker Database Schema
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('admin', 'parent', 'child')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Children
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  username TEXT UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  birth_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Types (học tập, ăn uống, giải trí, ngủ)
CREATE TABLE public.activity_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⭐',
  description TEXT DEFAULT '',
  star_level_1 INT NOT NULL DEFAULT 1,
  star_level_2 INT NOT NULL DEFAULT 2,
  star_level_3 INT NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penalty & Bonus Types
CREATE TABLE public.penalty_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'penalty' CHECK (type IN ('penalty', 'bonus')),
  star_deduction INT NOT NULL DEFAULT 1,
  icon TEXT NOT NULL DEFAULT '⚠️',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily Evaluations
CREATE TABLE public.daily_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  eval_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  total_stars_earned INT NOT NULL DEFAULT 0,
  total_stars_deducted INT NOT NULL DEFAULT 0,
  evaluated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, eval_date)
);

-- Evaluation Details (per activity)
CREATE TABLE public.evaluation_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.daily_evaluations(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES public.activity_types(id),
  star_level INT NOT NULL CHECK (star_level BETWEEN 1 AND 3),
  stars_earned INT NOT NULL DEFAULT 0,
  note TEXT DEFAULT ''
);

-- Evaluation Penalties (penalties applied in an evaluation)
CREATE TABLE public.evaluation_penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.daily_evaluations(id) ON DELETE CASCADE,
  penalty_type_id UUID NOT NULL REFERENCES public.penalty_types(id),
  stars_deducted INT NOT NULL DEFAULT 0,
  note TEXT DEFAULT ''
);

-- Rewards catalog
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  star_cost INT NOT NULL DEFAULT 10,
  tier TEXT NOT NULL DEFAULT 'weekly' CHECK (tier IN ('weekly', 'monthly', 'yearly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reward Redemptions
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id),
  stars_spent INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- Star Transactions (ledger)
CREATE TABLE public.star_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'penalty', 'redeem', 'reset')),
  amount INT NOT NULL,
  description TEXT DEFAULT '',
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_children_user_id ON public.children(user_id);
CREATE INDEX idx_daily_evaluations_child_date ON public.daily_evaluations(child_id, eval_date);
CREATE INDEX idx_star_transactions_child ON public.star_transactions(child_id);
CREATE INDEX idx_star_transactions_created ON public.star_transactions(created_at);
CREATE INDEX idx_reward_redemptions_child ON public.reward_redemptions(child_id);

-- ============================================
-- VIEWS
-- ============================================

-- View: Child star balance
CREATE OR REPLACE VIEW public.child_star_balance AS
SELECT
  c.id AS child_id,
  c.name AS child_name,
  COALESCE(SUM(st.amount), 0) AS total_stars
FROM public.children c
LEFT JOIN public.star_transactions st ON st.child_id = c.id
GROUP BY c.id, c.name;

-- ============================================
-- SEED DATA
-- ============================================

-- Default activity types
INSERT INTO public.activity_types (name, icon, description, star_level_1, star_level_2, star_level_3, sort_order) VALUES
  ('Học tập', '📚', 'Học bài, làm bài tập, đọc sách', 1, 2, 3, 1),
  ('Ăn uống', '🍽️', 'Ăn đầy đủ, ăn rau, không kén ăn', 1, 2, 3, 2),
  ('Giải trí', '🎮', 'Chơi đúng giờ, không quá thời gian', 1, 2, 3, 3),
  ('Ngủ nghỉ', '😴', 'Ngủ đúng giờ, ngủ đủ giấc', 1, 2, 3, 4);

-- Default penalty types
INSERT INTO public.penalty_types (name, description, star_deduction, icon) VALUES
  ('Không nghe lời', 'Không nghe lời bố mẹ', 2, '🚫'),
  ('La hét / khóc nhè', 'La hét, khóc nhè vô lý', 1, '😤'),
  ('Đánh bạn', 'Đánh hoặc bắt nạt bạn', 3, '👊'),
  ('Không dọn đồ chơi', 'Không dọn dẹp đồ chơi sau khi chơi', 1, '🧸'),
  ('Nói dối', 'Nói dối bố mẹ hoặc người lớn', 3, '🤥');

-- Default rewards
INSERT INTO public.rewards (name, description, star_cost, tier, image_url) VALUES
  ('Xem phim 30 phút', 'Được xem phim hoạt hình yêu thích 30 phút', 10, 'weekly', ''),
  ('Ăn kem', 'Được ăn 1 cây kem yêu thích', 15, 'weekly', ''),
  ('Chơi iPad 1 tiếng', 'Được chơi iPad 1 tiếng vào cuối tuần', 20, 'weekly', ''),
  ('Đồ chơi nhỏ', 'Được chọn 1 món đồ chơi nhỏ (dưới 100k)', 50, 'monthly', ''),
  ('Sách truyện mới', 'Được mua 1 cuốn sách truyện yêu thích', 40, 'monthly', ''),
  ('Đi công viên', 'Được đi công viên chơi cả ngày', 60, 'monthly', ''),
  ('Đồ chơi lớn', 'Được chọn 1 món đồ chơi lớn (dưới 500k)', 150, 'yearly', ''),
  ('Đi du lịch', 'Được đi du lịch cuối tuần', 200, 'yearly', ''),
  ('Quà sinh nhật đặc biệt', 'Quà sinh nhật siêu đặc biệt', 300, 'yearly', '');

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalty_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can do everything (family app)
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Authenticated users full access children" ON public.children FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access activity_types" ON public.activity_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access penalty_types" ON public.penalty_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access daily_evaluations" ON public.daily_evaluations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access evaluation_details" ON public.evaluation_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access evaluation_penalties" ON public.evaluation_penalties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access rewards" ON public.rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access reward_redemptions" ON public.reward_redemptions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access star_transactions" ON public.star_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read for activity_types, penalty_types, rewards (for unauthenticated views)
CREATE POLICY "Public can view activity_types" ON public.activity_types FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view penalty_types" ON public.penalty_types FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view rewards" ON public.rewards FOR SELECT TO anon USING (true);

-- ============================================
-- FUNCTION: Calculate child total stars
-- ============================================
CREATE OR REPLACE FUNCTION public.get_child_stars(p_child_id UUID)
RETURNS INT AS $$
  SELECT COALESCE(SUM(amount), 0)::INT
  FROM public.star_transactions
  WHERE child_id = p_child_id;
$$ LANGUAGE sql STABLE;

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- WEEKLY CHALLENGE (Migration)
-- ============================================

-- Add weekly challenge columns to rewards
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS is_weekly_challenge BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS weekly_bonus_stars INT NOT NULL DEFAULT 5;

-- Weekly challenge progress tracking
CREATE TABLE IF NOT EXISTS public.weekly_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Monday of the week
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
CREATE POLICY "Authenticated users full access weekly_challenge_progress" ON public.weekly_challenge_progress FOR ALL TO authenticated USING (true) WITH CHECK (true);
