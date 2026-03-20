-- Add RLS policies for staff table to allow all operations

-- First, enable RLS if not already enabled
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all select on staff" ON staff;
DROP POLICY IF EXISTS "Allow all insert on staff" ON staff;
DROP POLICY IF EXISTS "Allow all update on staff" ON staff;
DROP POLICY IF EXISTS "Allow all delete on staff" ON staff;

-- Create policies to allow all operations
CREATE POLICY "Allow all select on staff" ON staff
  FOR SELECT USING (true);

CREATE POLICY "Allow all insert on staff" ON staff
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on staff" ON staff
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all delete on staff" ON staff
  FOR DELETE USING (true);
