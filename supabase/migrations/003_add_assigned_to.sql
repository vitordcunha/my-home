-- Add assigned_to column to tasks_master table
ALTER TABLE tasks_master 
ADD COLUMN assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_tasks_master_assigned_to ON tasks_master(assigned_to);

-- Comment for documentation
COMMENT ON COLUMN tasks_master.assigned_to IS 'User assigned to complete this task';

