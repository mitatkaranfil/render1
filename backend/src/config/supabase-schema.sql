-- Create tables for Telegram Mining Mini App

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id TEXT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    photo_url TEXT,
    language_code TEXT,
    role TEXT DEFAULT 'user',
    mining_level INTEGER DEFAULT 1,
    mining_time_seconds INTEGER DEFAULT 3600, -- 1 hour by default
    daily_mining_seconds INTEGER DEFAULT 10800, -- 3 hours per day by default
    mining_start_time TIMESTAMP WITH TIME ZONE,
    mining_end_time TIMESTAMP WITH TIME ZONE,
    pending_rewards NUMERIC(18, 9) DEFAULT 0,
    wallet_balance NUMERIC(18, 9) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mining sessions table
CREATE TABLE IF NOT EXISTS mining_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    mining_level INTEGER NOT NULL,
    duration_hours FLOAT,
    reward FLOAT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad views table
CREATE TABLE IF NOT EXISTS ad_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ad_type TEXT NOT NULL,
    ad_id TEXT,
    reward_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mining rewards table
CREATE TABLE IF NOT EXISTS mining_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18, 9) NOT NULL,
    mining_level INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Level upgrades table
CREATE TABLE IF NOT EXISTS mining_upgrades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    old_level INTEGER NOT NULL,
    new_level INTEGER NOT NULL,
    cost NUMERIC(18, 9) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily stats table
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mining_time_seconds INTEGER DEFAULT 0,
    rewards_earned NUMERIC(18, 9) DEFAULT 0,
    level_ups INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mining_sessions_user_id ON mining_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_user_id ON ad_views(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_rewards_user_id ON mining_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_mining_upgrades_user_id ON mining_upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON daily_stats(user_id);

-- Create function to get total mining rewards
CREATE OR REPLACE FUNCTION public.get_total_mining_rewards(user_id_param UUID)
RETURNS FLOAT AS $$
DECLARE
    total_reward FLOAT;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total_reward
    FROM public.mining_rewards
    WHERE user_id = user_id_param;
    
    RETURN total_reward;
END;
$$ LANGUAGE plpgsql;

-- Create function to get leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_param INTEGER)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    first_name VARCHAR,
    photo_url VARCHAR,
    mining_level INTEGER,
    total_rewards FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.username,
        u.first_name,
        u.photo_url,
        u.mining_level,
        COALESCE(SUM(mr.amount), 0) AS total_rewards
    FROM 
        public.users u
    LEFT JOIN 
        public.mining_rewards mr ON u.id = mr.user_id
    GROUP BY 
        u.id, u.username, u.first_name, u.photo_url, u.mining_level
    ORDER BY 
        total_rewards DESC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to users table
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Function to calculate mining rate based on level
CREATE OR REPLACE FUNCTION calculate_mining_rate(mining_level INTEGER)
RETURNS NUMERIC(18, 9) AS $$
DECLARE
  base_rate NUMERIC(18, 9) := 0.000100; -- Base mining rate (0.0001 coins per hour)
  level_multiplier NUMERIC(18, 9) := 1 + ((mining_level - 1) * 0.05); -- 5% increase per level
BEGIN
  RETURN base_rate * level_multiplier;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate upgrade cost based on current level
CREATE OR REPLACE FUNCTION calculate_upgrade_cost(current_level INTEGER)
RETURNS NUMERIC(18, 9) AS $$
DECLARE
  base_cost NUMERIC(18, 9) := 0.001; -- Base cost for level 1 to 2
  exponential_factor NUMERIC(18, 9) := 1.8; -- Cost increases exponentially
BEGIN
  RETURN base_cost * (power(exponential_factor, current_level));
END;
$$ LANGUAGE plpgsql;

-- Function to get available mining time
CREATE OR REPLACE FUNCTION get_available_mining_time(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  remaining_time INTEGER;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  -- Return mining time if not mining
  IF user_record.mining_start_time IS NULL OR user_record.mining_end_time IS NULL THEN
    RETURN user_record.mining_time_seconds;
  END IF;
  
  -- If mining is active, return remaining time
  IF user_record.mining_end_time > now() THEN
    SELECT 
      user_record.mining_time_seconds - 
      EXTRACT(EPOCH FROM (now() - user_record.mining_start_time))::INTEGER
    INTO remaining_time;
    
    RETURN GREATEST(0, remaining_time);
  ELSE
    RETURN user_record.mining_time_seconds;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily mining time limit
CREATE OR REPLACE FUNCTION get_daily_mining_limit(mining_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Base daily limit is 3 hours (10800 seconds)
  -- Each 10 levels adds 1 hour (3600 seconds) with max of 12 hours (43200 seconds)
  RETURN LEAST(10800 + (FLOOR((mining_level - 1) / 10) * 3600), 43200);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can upgrade mining level
CREATE OR REPLACE FUNCTION can_upgrade_mining_level(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  upgrade_cost NUMERIC(18, 9);
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
  -- Calculate upgrade cost
  SELECT calculate_upgrade_cost(user_record.mining_level) INTO upgrade_cost;
  
  -- Check if user has enough balance
  RETURN user_record.wallet_balance >= upgrade_cost;
END;
$$ LANGUAGE plpgsql; 