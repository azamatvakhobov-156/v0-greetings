-- 156-maktab Boshqaruv Tizimi - Ma'lumotlar Bazasi Sxemasi

-- Foydalanuvchilar profili (auth.users bilan bog'langan)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'director', 'teacher')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sinflar jadvali
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  grade INTEGER NOT NULL CHECK (grade >= 1 AND grade <= 11),
  section TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id),
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fanlar jadvali
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bo'limlar jadvali (Xodimlar uchun)
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- O'quvchilar jadvali
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  parent_name TEXT,
  parent_phone TEXT,
  address TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Xodimlar jadvali
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  hire_date DATE,
  salary DECIMAL(12, 2),
  education TEXT,
  experience_years INTEGER,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- O'quvchilar davomati
CREATE TABLE IF NOT EXISTS public.student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Xodimlar davomati
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'on_leave')),
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date)
);

-- Dars jadvali
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 6),
  lesson_number INTEGER NOT NULL CHECK (lesson_number >= 1 AND lesson_number <= 8),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, day_of_week, lesson_number)
);

-- Baholar jadvali (Summativ baholash)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  grade_type TEXT NOT NULL CHECK (grade_type IN ('summative_1', 'summative_2', 'summative_3', 'summative_4', 'final')),
  score DECIMAL(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  max_score DECIMAL(5, 2) DEFAULT 100,
  quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
  academic_year TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ma'naviyat tadbirlari
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('meeting', 'competition', 'ceremony', 'training', 'other')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  organizer_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intizom yozuvlari
CREATE TABLE IF NOT EXISTS public.discipline_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('warning', 'violation', 'achievement', 'note')),
  description TEXT NOT NULL,
  action_taken TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  incident_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- O'quv rejalari
CREATE TABLE IF NOT EXISTS public.curriculum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  hours_per_week INTEGER,
  academic_year TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) yoqish
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Classes policies
CREATE POLICY "classes_select_all" ON public.classes FOR SELECT USING (true);
CREATE POLICY "classes_all_admin" ON public.classes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- Subjects policies
CREATE POLICY "subjects_select_all" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects_all_admin" ON public.subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- Departments policies
CREATE POLICY "departments_select_all" ON public.departments FOR SELECT USING (true);
CREATE POLICY "departments_all_admin" ON public.departments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- Students policies
CREATE POLICY "students_select_all" ON public.students FOR SELECT USING (true);
CREATE POLICY "students_all_staff" ON public.students FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'teacher'))
);

-- Staff policies
CREATE POLICY "staff_select_all" ON public.staff FOR SELECT USING (true);
CREATE POLICY "staff_all_admin" ON public.staff FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- Student attendance policies
CREATE POLICY "student_attendance_select_all" ON public.student_attendance FOR SELECT USING (true);
CREATE POLICY "student_attendance_all_staff" ON public.student_attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'teacher'))
);

-- Staff attendance policies
CREATE POLICY "staff_attendance_select_all" ON public.staff_attendance FOR SELECT USING (true);
CREATE POLICY "staff_attendance_all_admin" ON public.staff_attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- Schedule policies
CREATE POLICY "schedule_select_all" ON public.schedule FOR SELECT USING (true);
CREATE POLICY "schedule_all_admin" ON public.schedule FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- Grades policies
CREATE POLICY "grades_select_all" ON public.grades FOR SELECT USING (true);
CREATE POLICY "grades_all_staff" ON public.grades FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'teacher'))
);

-- Events policies
CREATE POLICY "events_select_all" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_all_staff" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'teacher'))
);

-- Discipline records policies
CREATE POLICY "discipline_select_all" ON public.discipline_records FOR SELECT USING (true);
CREATE POLICY "discipline_all_staff" ON public.discipline_records FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'teacher'))
);

-- Curriculum policies
CREATE POLICY "curriculum_select_all" ON public.curriculum FOR SELECT USING (true);
CREATE POLICY "curriculum_all_admin" ON public.curriculum FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_staff_department_id ON public.staff(department_id);
CREATE INDEX IF NOT EXISTS idx_student_attendance_date ON public.student_attendance(date);
CREATE INDEX IF NOT EXISTS idx_student_attendance_student_id ON public.student_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON public.staff_attendance(date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON public.staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedule_class_id ON public.schedule(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_day_of_week ON public.schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
