-- =====================================================
-- FIX TASKS HISTORY RLS POLICY
-- =====================================================
-- 
-- Issue: The current policy only allows users to complete tasks for themselves
-- (user_id = auth.uid()). This prevents marking tasks as completed for other
-- household members.
--
-- Solution: Allow any household member to mark tasks as completed for any
-- other member of the same household.

DROP POLICY IF EXISTS "Users can complete household tasks" ON tasks_history;

CREATE POLICY "Users can complete household tasks"
  ON tasks_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- The task must belong to the user's household
    task_id IN (
      SELECT id FROM tasks_master 
      WHERE household_id = get_user_household_id(auth.uid())
    ) AND
    -- The user_id (person who completed the task) must be in the same household
    get_user_household_id(user_id) = get_user_household_id(auth.uid())
  );

COMMENT ON POLICY "Users can complete household tasks" ON tasks_history IS 
  'Allows any household member to mark tasks as completed for any member of the same household';



