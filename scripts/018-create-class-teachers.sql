-- Create class_teachers table for assigning class teachers
CREATE TABLE IF NOT EXISTS class_teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  academic_year VARCHAR(10) DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, academic_year)
);

-- Create monitoring_results table for internal/external monitoring
CREATE TABLE IF NOT EXISTS monitoring_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('internal', 'external')),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 100,
  notes TEXT,
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_teachers
DROP POLICY IF EXISTS "Allow all for class_teachers" ON class_teachers;
CREATE POLICY "Allow all for class_teachers" ON class_teachers FOR ALL USING (true);

-- RLS policies for monitoring_results
DROP POLICY IF EXISTS "Allow all for monitoring_results" ON monitoring_results;
CREATE POLICY "Allow all for monitoring_results" ON monitoring_results FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_class_teachers_class ON class_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher ON class_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_subject ON monitoring_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_class ON monitoring_results(class_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_date ON monitoring_results(date);
