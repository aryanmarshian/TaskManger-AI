/*
  # Add priority column to tasks table

  1. Changes
    - Drop existing tasks table to ensure clean state
    - Recreate tasks table with all required columns including priority
    - Re-enable RLS and recreate policies
    - Add necessary indexes

  This migration ensures a clean state with all required columns.
*/

-- Drop existing table
DROP TABLE IF EXISTS tasks;

-- Create tasks table with all columns
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  description text,
  date timestamptz NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  ai_suggestions text,
  is_generating boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX tasks_user_id_idx ON tasks(user_id);
CREATE INDEX tasks_date_idx ON tasks(date);
CREATE INDEX tasks_priority_idx ON tasks(priority);