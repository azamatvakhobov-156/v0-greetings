-- Yangi rollar qo'shish va profiles jadvalini yangilash

-- 1. Eski CHECK constraint'ni olib tashlash
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Yangi CHECK constraint qo'shish (11 ta rol)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
  'admin',           -- Administrator - to'liq huquq
  'director',        -- Direktor
  'deputy_academic', -- O'quv ishlari bo'yicha direktor o'rinbosari
  'deputy_education',-- Tarbiya ishlari bo'yicha direktor o'rinbosari
  'head_hr',         -- Kadrlar bo'limi boshlig'i
  'head_academic',   -- O'quv bo'limi mudiri
  'head_spiritual',  -- Ma'naviyat bo'limi mudiri
  'teacher',         -- Pedagog
  'accountant',      -- Buxgalter
  'librarian',       -- Kutubxonachi
  'technical'        -- Texnik xodim
));

-- 3. Trigger funksiyasini yangilash (yangi rollar bilan)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Foydalanuvchi'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'teacher'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 4. RLS policies yangilash (yangi rollar bilan)
DROP POLICY IF EXISTS "classes_all_admin" ON public.classes;
CREATE POLICY "classes_all_admin" ON public.classes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'deputy_academic', 'head_academic'))
);

DROP POLICY IF EXISTS "students_all_staff" ON public.students;
CREATE POLICY "students_all_staff" ON public.students FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'deputy_academic', 'deputy_education', 'head_academic', 'teacher'))
);

DROP POLICY IF EXISTS "staff_all_admin" ON public.staff;
CREATE POLICY "staff_all_admin" ON public.staff FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_hr'))
);

DROP POLICY IF EXISTS "staff_attendance_all_admin" ON public.staff_attendance;
CREATE POLICY "staff_attendance_all_admin" ON public.staff_attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'head_hr', 'deputy_academic', 'deputy_education'))
);

DROP POLICY IF EXISTS "grades_all_staff" ON public.grades;
CREATE POLICY "grades_all_staff" ON public.grades FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'deputy_academic', 'head_academic', 'teacher'))
);

DROP POLICY IF EXISTS "events_all_staff" ON public.events;
CREATE POLICY "events_all_staff" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'deputy_education', 'head_spiritual', 'teacher'))
);

-- 5. Topshiriqlar jadvali yaratish
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('personal', 'department', 'general')),
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_by UUID REFERENCES public.profiles(id),
  department_id UUID REFERENCES public.departments(id),
  deadline TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
  attachment_url TEXT,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks uchun RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT USING (
  assigned_to = auth.uid() OR 
  assigned_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'deputy_academic', 'deputy_education'))
);

CREATE POLICY "tasks_insert_managers" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director', 'deputy_academic', 'deputy_education', 'head_hr', 'head_academic', 'head_spiritual'))
);

CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE USING (
  assigned_to = auth.uid() OR 
  assigned_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'director'))
);

-- Tasks uchun updated_at trigger
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tasks uchun index
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON public.tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
