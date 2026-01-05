-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome TEXT NOT NULL,
  avatar TEXT,
  total_points INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.raw_user_meta_data->>'avatar'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tasks Master table (regras de recorrência)
CREATE TABLE tasks_master (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  xp_value INTEGER NOT NULL CHECK (xp_value > 0),
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'once')),
  days_of_week INTEGER[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Create validation function for days_of_week
CREATE OR REPLACE FUNCTION validate_days_of_week(days INTEGER[])
RETURNS BOOLEAN AS $$
BEGIN
  IF days IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if all values are between 0 and 6
  RETURN (
    SELECT bool_and(day >= 0 AND day <= 6)
    FROM unnest(days) AS day
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint using the validation function
ALTER TABLE tasks_master ADD CONSTRAINT valid_days_of_week 
  CHECK (validate_days_of_week(days_of_week));

-- Tasks History table (registros de conclusão)
CREATE TABLE tasks_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks_master(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  xp_earned INTEGER NOT NULL CHECK (xp_earned > 0)
);

-- Create index for faster queries
CREATE INDEX idx_tasks_history_user_id ON tasks_history(user_id);
CREATE INDEX idx_tasks_history_task_id ON tasks_history(task_id);
CREATE INDEX idx_tasks_history_completed_at ON tasks_history(completed_at DESC);

-- Rewards table
CREATE TABLE rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  custo_pontos INTEGER NOT NULL CHECK (custo_pontos > 0),
  resgatado_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resgatado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Function to update user points when task is completed
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Add points to user's total
  UPDATE profiles
  SET total_points = total_points + NEW.xp_earned
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update points automatically
CREATE TRIGGER on_task_completed
  AFTER INSERT ON tasks_history
  FOR EACH ROW EXECUTE FUNCTION update_user_points();

-- Function to deduct points when reward is redeemed
CREATE OR REPLACE FUNCTION redeem_reward()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if reward is being redeemed (not already redeemed)
  IF OLD.resgatado_por IS NULL AND NEW.resgatado_por IS NOT NULL THEN
    -- Check if user has enough points
    IF (SELECT total_points FROM profiles WHERE id = NEW.resgatado_por) < NEW.custo_pontos THEN
      RAISE EXCEPTION 'Pontos insuficientes para resgatar este prêmio';
    END IF;
    
    -- Deduct points
    UPDATE profiles
    SET total_points = total_points - NEW.custo_pontos
    WHERE id = NEW.resgatado_por;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for reward redemption
CREATE TRIGGER on_reward_redeemed
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION redeem_reward();

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending auth.users with gamification data';
COMMENT ON TABLE tasks_master IS 'Master list of tasks with recurrence rules';
COMMENT ON TABLE tasks_history IS 'Historical record of completed tasks';
COMMENT ON TABLE rewards IS 'Rewards that can be redeemed with points';
COMMENT ON COLUMN tasks_master.days_of_week IS 'Array of integers 0-6 representing Sunday-Saturday for weekly recurrence';
COMMENT ON COLUMN tasks_master.recurrence_type IS 'Type of recurrence: daily, weekly, or once';

