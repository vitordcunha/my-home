-- =====================================================
-- HOUSEHOLDS SYSTEM - Multi-tenancy Implementation
-- =====================================================

-- Create households table
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous chars
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invite codes
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    LOOP
      NEW.invite_code := generate_invite_code();
      BEGIN
        -- Check if code is unique
        PERFORM 1 FROM households WHERE invite_code = NEW.invite_code;
        IF NOT FOUND THEN
          EXIT;
        END IF;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invite_code
  BEFORE INSERT ON households
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- Add household_id to profiles table
ALTER TABLE profiles 
ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE,
ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member'));

-- Add household_id to tasks_master table
ALTER TABLE tasks_master 
ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;

-- Add household_id to rewards table
ALTER TABLE rewards 
ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX idx_households_invite_code ON households(invite_code);
CREATE INDEX idx_profiles_household ON profiles(household_id);
CREATE INDEX idx_tasks_master_household ON tasks_master(household_id);
CREATE INDEX idx_rewards_household ON rewards(household_id);

-- Enable RLS on households table
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE households IS 'Households/families for multi-tenancy isolation';
COMMENT ON COLUMN households.invite_code IS 'Unique 8-character code for inviting members';
COMMENT ON COLUMN profiles.household_id IS 'Household this user belongs to';
COMMENT ON COLUMN profiles.role IS 'User role: admin can manage household, member is regular user';
COMMENT ON COLUMN tasks_master.household_id IS 'Household this task belongs to';
COMMENT ON COLUMN rewards.household_id IS 'Household this reward belongs to';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create household and set user as admin
CREATE OR REPLACE FUNCTION create_household_for_user(
  p_user_id UUID,
  p_household_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Create household
  INSERT INTO households (name, created_by)
  VALUES (p_household_name, p_user_id)
  RETURNING id INTO v_household_id;
  
  -- Update user's profile
  UPDATE profiles
  SET household_id = v_household_id, role = 'admin'
  WHERE id = p_user_id;
  
  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join household by invite code
CREATE OR REPLACE FUNCTION join_household_by_code(
  p_user_id UUID,
  p_invite_code TEXT
)
RETURNS UUID AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Find household by invite code
  SELECT id INTO v_household_id
  FROM households
  WHERE invite_code = UPPER(p_invite_code);
  
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  
  -- Update user's profile
  UPDATE profiles
  SET household_id = v_household_id, role = 'member'
  WHERE id = p_user_id;
  
  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to regenerate invite code for household
CREATE OR REPLACE FUNCTION regenerate_invite_code(p_household_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_new_code TEXT;
BEGIN
  LOOP
    v_new_code := generate_invite_code();
    BEGIN
      UPDATE households
      SET invite_code = v_new_code
      WHERE id = p_household_id
      RETURNING invite_code INTO v_new_code;
      
      IF FOUND THEN
        EXIT;
      END IF;
    END;
  END LOOP;
  
  RETURN v_new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove member from household (admin only)
CREATE OR REPLACE FUNCTION remove_household_member(
  p_admin_id UUID,
  p_member_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_household_id UUID;
  v_admin_role TEXT;
  v_member_household_id UUID;
BEGIN
  -- Check if requester is admin
  SELECT household_id, role INTO v_admin_household_id, v_admin_role
  FROM profiles
  WHERE id = p_admin_id;
  
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can remove members';
  END IF;
  
  -- Check if member is in same household
  SELECT household_id INTO v_member_household_id
  FROM profiles
  WHERE id = p_member_id;
  
  IF v_admin_household_id != v_member_household_id THEN
    RAISE EXCEPTION 'Member not in your household';
  END IF;
  
  -- Prevent removing yourself
  IF p_admin_id = p_member_id THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;
  
  -- Remove member from household
  UPDATE profiles
  SET household_id = NULL, role = 'member'
  WHERE id = p_member_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_household_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION join_household_by_code TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION remove_household_member TO authenticated;


