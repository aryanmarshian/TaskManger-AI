/*
  # Add priority to tasks table

  1. Changes
    - Add priority column to tasks table with type text
    - Set default priority to 'medium'
    - Add check constraint to ensure valid priority values
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));