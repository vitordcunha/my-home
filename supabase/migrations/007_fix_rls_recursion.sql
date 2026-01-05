-- =====================================================
-- FIX RLS INFINITE RECURSION
-- =====================================================

-- The issue: policies that query the profiles table inside profiles policies
-- create infinite recursion. Solution: use SECURITY DEFINER functions.

-- Create a security definer function to get user's household
CREATE OR REPLACE FUNCTION get_user_household_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT household_id FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_household_id TO authenticated;

-- Comment
COMMENT ON FUNCTION get_user_household_id IS 'Security definer function to avoid RLS recursion when checking household membership';

-- =====================================================
-- RECREATE PROFILES POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view household members" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view household members"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    household_id = get_user_household_id(auth.uid()) OR
    id = auth.uid() -- Allow users to always see their own profile
  );

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RECREATE TASKS MASTER POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view household tasks" ON tasks_master;
DROP POLICY IF EXISTS "Users can create household tasks" ON tasks_master;
DROP POLICY IF EXISTS "Users can update own household tasks" ON tasks_master;
DROP POLICY IF EXISTS "Users can delete own household tasks" ON tasks_master;

CREATE POLICY "Users can view household tasks"
  ON tasks_master
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    household_id = get_user_household_id(auth.uid())
  );

CREATE POLICY "Users can create household tasks"
  ON tasks_master
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    household_id = get_user_household_id(auth.uid())
  );

CREATE POLICY "Users can update own household tasks"
  ON tasks_master
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by AND
    household_id = get_user_household_id(auth.uid())
  )
  WITH CHECK (
    auth.uid() = created_by AND
    household_id = get_user_household_id(auth.uid())
  );

CREATE POLICY "Users can delete own household tasks"
  ON tasks_master
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by AND
    household_id = get_user_household_id(auth.uid())
  );

-- =====================================================
-- RECREATE TASKS HISTORY POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view household task history" ON tasks_history;
DROP POLICY IF EXISTS "Users can complete household tasks" ON tasks_history;

CREATE POLICY "Users can view household task history"
  ON tasks_history
  FOR SELECT
  TO authenticated
  USING (
    task_id IN (
      SELECT id FROM tasks_master 
      WHERE household_id = get_user_household_id(auth.uid())
    )
  );

CREATE POLICY "Users can complete household tasks"
  ON tasks_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    task_id IN (
      SELECT id FROM tasks_master 
      WHERE household_id = get_user_household_id(auth.uid())
    )
  );

-- =====================================================
-- RECREATE REWARDS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view household rewards" ON rewards;
DROP POLICY IF EXISTS "Admins can create household rewards" ON rewards;
DROP POLICY IF EXISTS "Users can update household rewards" ON rewards;
DROP POLICY IF EXISTS "Admins can delete household rewards" ON rewards;

CREATE POLICY "Users can view household rewards"
  ON rewards
  FOR SELECT
  TO authenticated
  USING (
    (is_active = true OR resgatado_por = auth.uid()) AND
    household_id = get_user_household_id(auth.uid())
  );

CREATE POLICY "Admins can create household rewards"
  ON rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND household_id = get_user_household_id(auth.uid())
    )
  );

CREATE POLICY "Users can update household rewards"
  ON rewards
  FOR UPDATE
  TO authenticated
  USING (
    household_id = get_user_household_id(auth.uid())
  )
  WITH CHECK (
    household_id = get_user_household_id(auth.uid())
  );

CREATE POLICY "Admins can delete household rewards"
  ON rewards
  FOR DELETE
  TO authenticated
  USING (
    household_id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND household_id = get_user_household_id(auth.uid())
    )
  );

-- =====================================================
-- RECREATE HOUSEHOLDS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own household" ON households;
DROP POLICY IF EXISTS "Admins can update own household" ON households;

CREATE POLICY "Users can view own household"
  ON households
  FOR SELECT
  TO authenticated
  USING (
    id = get_user_household_id(auth.uid())
  );

CREATE POLICY "Admins can update own household"
  ON households
  FOR UPDATE
  TO authenticated
  USING (
    id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND household_id = get_user_household_id(auth.uid())
    )
  )
  WITH CHECK (
    id = get_user_household_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin' 
      AND household_id = get_user_household_id(auth.uid())
    )
  );

