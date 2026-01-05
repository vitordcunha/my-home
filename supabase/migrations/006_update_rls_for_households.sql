-- =====================================================
-- UPDATE RLS POLICIES FOR MULTI-TENANCY
-- =====================================================

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Anyone can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active tasks" ON tasks_master;
DROP POLICY IF EXISTS "Anyone can create tasks" ON tasks_master;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks_master;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks_master;
DROP POLICY IF EXISTS "Anyone can view task history" ON tasks_history;
DROP POLICY IF EXISTS "Anyone can complete tasks" ON tasks_history;
DROP POLICY IF EXISTS "Anyone can view active rewards" ON rewards;
DROP POLICY IF EXISTS "Anyone can create rewards" ON rewards;
DROP POLICY IF EXISTS "Anyone can update rewards" ON rewards;
DROP POLICY IF EXISTS "Anyone can delete rewards" ON rewards;

-- =====================================================
-- HOUSEHOLDS POLICIES
-- =====================================================

-- Users can view households they belong to
CREATE POLICY "Users can view own household"
  ON households
  FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- Users can update their own household if they are admin
CREATE POLICY "Admins can update own household"
  ON households
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT household_id 
      FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT household_id 
      FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PROFILES POLICIES (Updated for Multi-tenancy)
-- =====================================================

-- Users can view profiles in their household
CREATE POLICY "Users can view household members"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- TASKS MASTER POLICIES (Updated for Multi-tenancy)
-- =====================================================

-- Users can view active tasks in their household
CREATE POLICY "Users can view household tasks"
  ON tasks_master
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can create tasks in their household
CREATE POLICY "Users can create household tasks"
  ON tasks_master
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update tasks they created in their household
CREATE POLICY "Users can update own household tasks"
  ON tasks_master
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by AND
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = created_by AND
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can delete tasks they created in their household
CREATE POLICY "Users can delete own household tasks"
  ON tasks_master
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by AND
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- TASKS HISTORY POLICIES (Updated for Multi-tenancy)
-- =====================================================

-- Users can view task history in their household
CREATE POLICY "Users can view household task history"
  ON tasks_history
  FOR SELECT
  TO authenticated
  USING (
    task_id IN (
      SELECT id FROM tasks_master 
      WHERE household_id IN (
        SELECT household_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Users can insert task completions in their household
CREATE POLICY "Users can complete household tasks"
  ON tasks_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    task_id IN (
      SELECT id FROM tasks_master 
      WHERE household_id IN (
        SELECT household_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Prevent updates and deletes of history (immutable record)
CREATE POLICY "No one can update history"
  ON tasks_history
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No one can delete history"
  ON tasks_history
  FOR DELETE
  TO authenticated
  USING (false);

-- =====================================================
-- REWARDS POLICIES (Updated for Multi-tenancy)
-- =====================================================

-- Users can view active rewards in their household
CREATE POLICY "Users can view household rewards"
  ON rewards
  FOR SELECT
  TO authenticated
  USING (
    (is_active = true OR resgatado_por = auth.uid()) AND
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can create rewards in their household
CREATE POLICY "Admins can create household rewards"
  ON rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update rewards in their household (for redemption)
-- Admins can update any reward, members can only redeem
CREATE POLICY "Users can update household rewards"
  ON rewards
  FOR UPDATE
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Admins can delete rewards in their household
CREATE POLICY "Admins can delete household rewards"
  ON rewards
  FOR DELETE
  TO authenticated
  USING (
    household_id IN (
      SELECT household_id 
      FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- UPDATE HELPER FUNCTIONS
-- =====================================================

-- Update function to get today's completed tasks for a user (scoped to household)
CREATE OR REPLACE FUNCTION get_todays_completed_tasks(user_uuid UUID)
RETURNS TABLE (task_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT th.task_id
  FROM tasks_history th
  INNER JOIN tasks_master tm ON th.task_id = tm.id
  INNER JOIN profiles p ON p.id = user_uuid
  WHERE th.user_id = user_uuid
    AND th.completed_at >= CURRENT_DATE
    AND th.completed_at < CURRENT_DATE + INTERVAL '1 day'
    AND tm.household_id = p.household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to check task completion (scoped to household)
CREATE OR REPLACE FUNCTION is_task_completed_recently(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_household UUID;
  v_task_household UUID;
BEGIN
  -- Get user's household
  SELECT household_id INTO v_user_household
  FROM profiles
  WHERE id = auth.uid();
  
  -- Get task's household
  SELECT household_id INTO v_task_household
  FROM tasks_master
  WHERE id = p_task_id;
  
  -- Check if same household and task was completed
  IF v_user_household = v_task_household THEN
    RETURN EXISTS (
      SELECT 1
      FROM tasks_history
      WHERE task_id = p_task_id
        AND completed_at > NOW() - INTERVAL '24 hours'
    );
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON POLICY "Users can view household members" ON profiles IS 'Users can only see members of their household';
COMMENT ON POLICY "Users can view household tasks" ON tasks_master IS 'Users can only see tasks in their household';
COMMENT ON POLICY "Users can view household task history" ON tasks_history IS 'Transparency within household only';
COMMENT ON POLICY "Users can view household rewards" ON rewards IS 'Users can only see rewards in their household';


