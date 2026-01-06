-- Add rotation_enabled column to tasks_master table
ALTER TABLE tasks_master
ADD COLUMN rotation_enabled boolean DEFAULT false NOT NULL;

-- Create index for faster queries
CREATE INDEX idx_tasks_master_rotation_enabled ON tasks_master(rotation_enabled);

-- Comment for documentation
COMMENT ON COLUMN tasks_master.rotation_enabled IS 'If true, task assignee rotates automatically after completion';

-- Function to rotate task assignee after completion
CREATE OR REPLACE FUNCTION rotate_task_assignee()
RETURNS TRIGGER AS $$
DECLARE
    v_household_id uuid;
    v_is_rotating boolean;
    v_current_assignee uuid;
    v_next_assignee uuid;
    v_members uuid[];
    v_current_index int;
BEGIN
    -- Get task information
    SELECT household_id, assigned_to, rotation_enabled
    INTO v_household_id, v_current_assignee, v_is_rotating
    FROM tasks_master
    WHERE id = NEW.task_id;

    -- Only execute if rotation is enabled, has household, and has current assignee
    IF v_is_rotating IS TRUE AND v_household_id IS NOT NULL AND v_current_assignee IS NOT NULL THEN
        -- Get all household members ordered by creation date (for consistent rotation order)
        SELECT array_agg(id ORDER BY created_at)
        INTO v_members
        FROM profiles
        WHERE household_id = v_household_id;

        -- If no members found, do nothing
        IF v_members IS NULL OR array_length(v_members, 1) = 0 THEN
            RETURN NEW;
        END IF;

        -- Find current assignee position in the array
        v_current_index := array_position(v_members, v_current_assignee);

        -- Determine next assignee:
        -- If current assignee is the last in list -> go to first
        IF v_current_index IS NULL OR v_current_index = array_length(v_members, 1) THEN
            v_next_assignee := v_members[1];
        ELSE
            -- Otherwise, go to next in list
            v_next_assignee := v_members[v_current_index + 1];
        END IF;

        -- Update task with new assignee
        UPDATE tasks_master
        SET assigned_to = v_next_assignee
        WHERE id = NEW.task_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a task is completed (inserted into history)
DROP TRIGGER IF EXISTS on_task_complete_rotate ON tasks_history;
CREATE TRIGGER on_task_complete_rotate
AFTER INSERT ON tasks_history
FOR EACH ROW
EXECUTE FUNCTION rotate_task_assignee();

-- Comment for documentation
COMMENT ON FUNCTION rotate_task_assignee() IS 'Automatically rotates task assignee to next household member when rotation is enabled';

