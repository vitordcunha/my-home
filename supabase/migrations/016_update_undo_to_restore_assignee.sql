-- =====================================================
-- UPDATE UNDO TASK FUNCTION TO RESTORE ASSIGNEE
-- =====================================================
-- 
-- Updates the undo_task_completion function to restore
-- the assigned_to field to the person who completed the task
-- when rotation is enabled

-- Function to undo a task completion (updated version)
CREATE OR REPLACE FUNCTION undo_task_completion(p_history_id UUID)
RETURNS TABLE(
  task_id UUID,
  user_id UUID,
  xp_deducted INTEGER
) AS $$
DECLARE
  v_task_id UUID;
  v_user_id UUID;
  v_xp_earned INTEGER;
  v_household_id UUID;
BEGIN
  -- Get the history record and verify it exists
  SELECT th.task_id, th.user_id, th.xp_earned INTO v_task_id, v_user_id, v_xp_earned
  FROM tasks_history th
  WHERE th.id = p_history_id;
  
  IF v_task_id IS NULL THEN
    RAISE EXCEPTION 'Histórico de tarefa não encontrado';
  END IF;
  
  -- Get the current user's household
  SELECT household_id INTO v_household_id
  FROM profiles
  WHERE id = auth.uid();
  
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não possui household';
  END IF;
  
  -- Verify the task belongs to the same household
  IF NOT EXISTS (
    SELECT 1 FROM tasks_master tm
    WHERE tm.id = v_task_id
    AND tm.household_id = v_household_id
  ) THEN
    RAISE EXCEPTION 'Tarefa não pertence ao seu household';
  END IF;
  
  -- Verify the user who completed the task is in the same household
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = v_user_id
    AND p.household_id = v_household_id
  ) THEN
    RAISE EXCEPTION 'Usuário que completou a tarefa não está no mesmo household';
  END IF;
  
  -- Deduct points from the user (before deleting the record)
  -- Ensure points don't go below 0
  UPDATE profiles
  SET total_points = GREATEST(0, total_points - v_xp_earned)
  WHERE id = v_user_id;
  
  -- If task has rotation enabled, restore assigned_to to the user who completed it
  -- This ensures that when a task is undone, it goes back to the person who did it
  UPDATE tasks_master
  SET assigned_to = v_user_id
  WHERE id = v_task_id
    AND rotation_enabled = true;
  
  -- Delete the history record
  DELETE FROM tasks_history
  WHERE id = p_history_id;
  
  -- Return the result
  RETURN QUERY SELECT v_task_id, v_user_id, v_xp_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION undo_task_completion IS 
  'Allows users to undo a completed task by deleting the history record, deducting points, and restoring assigned_to to the original completer if rotation is enabled';

