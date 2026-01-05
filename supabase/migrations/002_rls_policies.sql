-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Anyone authenticated can view all profiles (household members)
CREATE POLICY "Anyone can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but policy for safety)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- TASKS MASTER POLICIES
-- =====================================================

-- Anyone authenticated can view active tasks
CREATE POLICY "Anyone can view active tasks"
  ON tasks_master
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Anyone authenticated can create tasks
CREATE POLICY "Anyone can create tasks"
  ON tasks_master
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update tasks they created
CREATE POLICY "Users can update own tasks"
  ON tasks_master
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete (soft delete by setting is_active = false) tasks they created
CREATE POLICY "Users can delete own tasks"
  ON tasks_master
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- =====================================================
-- TASKS HISTORY POLICIES
-- =====================================================

-- Anyone authenticated can view all task history (household transparency)
CREATE POLICY "Anyone can view task history"
  ON tasks_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can insert task completions
CREATE POLICY "Anyone can complete tasks"
  ON tasks_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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
-- REWARDS POLICIES
-- =====================================================

-- Anyone authenticated can view active rewards
CREATE POLICY "Anyone can view active rewards"
  ON rewards
  FOR SELECT
  TO authenticated
  USING (is_active = true OR resgatado_por = auth.uid());

-- Anyone authenticated can create rewards
CREATE POLICY "Anyone can create rewards"
  ON rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anyone can update rewards (for redemption)
CREATE POLICY "Anyone can update rewards"
  ON rewards
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anyone authenticated can delete rewards (soft delete)
CREATE POLICY "Anyone can delete rewards"
  ON rewards
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- HELPER FUNCTIONS FOR CLIENT USE
-- =====================================================

-- Function to get today's completed tasks for a user
CREATE OR REPLACE FUNCTION get_todays_completed_tasks(user_uuid UUID)
RETURNS TABLE (task_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT th.task_id
  FROM tasks_history th
  WHERE th.user_id = user_uuid
    AND th.completed_at >= CURRENT_DATE
    AND th.completed_at < CURRENT_DATE + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get task completion status for last 24 hours
CREATE OR REPLACE FUNCTION is_task_completed_recently(p_task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM tasks_history
    WHERE task_id = p_task_id
      AND completed_at > NOW() - INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_todays_completed_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION is_task_completed_recently TO authenticated;

-- Comments
COMMENT ON POLICY "Anyone can view all profiles" ON profiles IS 'All household members can see each other';
COMMENT ON POLICY "Anyone can view task history" ON tasks_history IS 'Transparency: everyone sees who did what';
COMMENT ON POLICY "No one can update history" ON tasks_history IS 'Task history is immutable for integrity';
COMMENT ON FUNCTION get_todays_completed_tasks IS 'Helper function to check which tasks user completed today';
COMMENT ON FUNCTION is_task_completed_recently IS 'Check if a task was completed in the last 24 hours';

